import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { Role } from '@prisma/client';

import { ClassroomBookingService } from './classroom-booking.service';
import { DatabaseService } from '../database/database.service';
import { NotificationService } from '../notification/notification.service';

describe('ClassroomBookingService', () => {
  let service: ClassroomBookingService;
  let databaseService: typeof mockDatabaseService;
  let notificationService: typeof mockNotificationService;

  const mockDatabaseService = {
    employee: {
      findUnique: jest.fn(),
    },
    classroom: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
    },
    classroomBooking: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      createMany: jest.fn(),
      update: jest.fn(),
    },
  };

  const mockNotificationService = {
    create: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        ClassroomBookingService,
        {
          provide: DatabaseService,
          useValue: mockDatabaseService,
        },
        {
          provide: NotificationService,
          useValue: mockNotificationService,
        },
      ],
    }).compile();

    service = moduleRef.get<ClassroomBookingService>(ClassroomBookingService);
    databaseService = moduleRef.get(DatabaseService);
    notificationService = moduleRef.get(NotificationService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const missingFieldsCases: Array<[string, any]> = [
      ['missing classroomId', { bookingDate: '2026-08-04', startTime: '2026-08-04T10:00:00Z', endTime: '2026-08-04T11:00:00Z' }],
      ['missing bookingDate', { classroomId: 1, startTime: '2026-08-04T10:00:00Z', endTime: '2026-08-04T11:00:00Z' }],
      ['missing startTime', { classroomId: 1, bookingDate: '2026-08-04', endTime: '2026-08-04T11:00:00Z' }],
      ['missing endTime', { classroomId: 1, bookingDate: '2026-08-04', startTime: '2026-08-04T10:00:00Z' }],
    ];

    it.each(missingFieldsCases)(
      'should throw BadRequestException when %s',
      async (caseName: string, dto: any) => {
        await expect(service.create(dto, 1)).rejects.toThrow(
          BadRequestException,
        );
        await expect(service.create(dto, 1)).rejects.toThrow(
          'Missing required fields',
        );
      },
    );

    it('should throw BadRequestException for invalid date format', async () => {
      const dto = {
        classroomId: 1,
        bookingDate: 'invalid-date',
        startTime: '2026-08-04T10:00:00Z',
        endTime: '2026-08-04T11:00:00Z',
      };

      await expect(service.create(dto, 1)).rejects.toThrow(
        'Invalid date or time format',
      );
    });

    it('should throw BadRequestException when startTime >= endTime', async () => {
      const dto = {
        classroomId: 1,
        bookingDate: '2026-08-04',
        startTime: '2026-08-04T12:00:00Z',
        endTime: '2026-08-04T10:00:00Z',
      };

      await expect(service.create(dto, 1)).rejects.toThrow(
        'Invalid time range',
      );
    });

    it('should throw BadRequestException when classroom is not found or inactive', async () => {
      const dto = {
        classroomId: 1,
        bookingDate: '2026-08-04',
        startTime: '2026-08-04T10:00:00Z',
        endTime: '2026-08-04T11:00:00Z',
      };
      databaseService.classroom.findFirst.mockResolvedValue(null);

      await expect(service.create(dto, 1)).rejects.toThrow(
        'Classroom not found or inactive',
      );
    });

    it('should throw ForbiddenException if staff attempts to book for someone else', async () => {
      const dto = {
        classroomId: 1,
        bookingDate: '2026-08-04',
        startTime: '2026-08-04T10:00:00Z',
        endTime: '2026-08-04T11:00:00Z',
        bookForUserId: 99,
      };
      databaseService.classroom.findFirst.mockResolvedValue({
        id: 1,
        isActive: true,
      });
      databaseService.employee.findUnique.mockResolvedValue({
        id: 1,
        role: Role.STAFF,
        subDepartmentId: 2,
      });

      await expect(service.create(dto, 1)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should throw ConflictException if booking slot conflicts with existing booking', async () => {
      const dto = {
        classroomId: 1,
        bookingDate: '2026-08-04',
        startTime: '2026-08-04T10:00:00Z',
        endTime: '2026-08-04T11:00:00Z',
      };
      databaseService.classroom.findFirst.mockResolvedValue({
        id: 1,
        isActive: true,
      });
      databaseService.employee.findUnique.mockResolvedValue({
        id: 1,
        role: Role.ADMIN,
      });
      databaseService.classroomBooking.findFirst.mockResolvedValue({
        id: 99,
      });

      await expect(service.create(dto, 1)).rejects.toThrow(
        ConflictException,
      );
    });

    it('should successfully create single non-recurring booking and send notification', async () => {
      const dto = {
        classroomId: 1,
        bookingDate: '2026-08-04',
        startTime: '2026-08-04T10:00:00Z',
        endTime: '2026-08-04T11:00:00Z',
        title: 'Lecture',
      };
      databaseService.classroom.findFirst.mockResolvedValue({
        id: 1,
        isActive: true,
      });
      databaseService.employee.findUnique.mockResolvedValue({
        id: 1,
        role: Role.STAFF,
      });
      databaseService.classroomBooking.findFirst.mockResolvedValue(null);
      const mockCreated = { id: 10, ...dto };
      databaseService.classroomBooking.create.mockResolvedValue(mockCreated);
      databaseService.classroom.findUnique.mockResolvedValue({
        name: 'Room 101',
      });

      const result = await service.create(dto, 1);

      expect(databaseService.classroomBooking.create).toHaveBeenCalled();
      expect(notificationService.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 1,
          type: 'CLASSROOM_BOOKED',
          entityId: 10,
        }),
      );
      expect(result).toEqual(mockCreated);
    });
  });

  describe('findByDate', () => {
    it('should throw BadRequestException if date is invalid', async () => {
      await expect(service.findByDate(1, 'invalid-date')).rejects.toThrow(
        'Invalid date',
      );
    });

    it('should return bookings for classroom on given date', async () => {
      const mockBookings = [{ id: 1 }];
      databaseService.classroomBooking.findMany.mockResolvedValue(
        mockBookings,
      );

      const result = await service.findByDate(1, '2026-08-04');

      expect(databaseService.classroomBooking.findMany).toHaveBeenCalled();
      expect(result).toEqual(mockBookings);
    });
  });

  describe('cancel', () => {
    it('should throw BadRequestException when booking is not found', async () => {
      databaseService.classroomBooking.findUnique.mockResolvedValue(null);

      await expect(service.cancel(1, 10)).rejects.toThrow(
        'Booking not found',
      );
    });

    it('should throw BadRequestException when booking is already cancelled', async () => {
      databaseService.classroomBooking.findUnique.mockResolvedValue({
        id: 1,
        isCancelled: true,
      });

      await expect(service.cancel(1, 10)).rejects.toThrow(
        'Booking already cancelled',
      );
    });

    it('should throw ForbiddenException if non-owner and non-admin attempts to cancel', async () => {
      databaseService.classroomBooking.findUnique.mockResolvedValue({
        id: 1,
        bookedById: 50,
        isCancelled: false,
      });
      databaseService.employee.findUnique.mockResolvedValue({
        id: 10,
        role: Role.STAFF,
      });

      await expect(service.cancel(1, 10)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should cancel booking and send notification when owner cancels', async () => {
      databaseService.classroomBooking.findUnique.mockResolvedValue({
        id: 1,
        bookedById: 10,
        isCancelled: false,
      });
      databaseService.employee.findUnique.mockResolvedValue({
        id: 10,
        role: Role.STAFF,
      });
      databaseService.classroomBooking.update.mockResolvedValue({
        id: 1,
        isCancelled: true,
        classroom: { name: 'Room A' },
      });

      const result = await service.cancel(1, 10);

      expect(databaseService.classroomBooking.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: expect.objectContaining({
          isCancelled: true,
          cancelledById: 10,
        }),
        include: { classroom: { select: { name: true } } },
      });
      expect(notificationService.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 10,
          type: 'BOOKING_CANCELLED',
        }),
      );
      expect(result.isCancelled).toBe(true);
    });
  });
});
