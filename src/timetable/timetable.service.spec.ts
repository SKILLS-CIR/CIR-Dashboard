import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Role } from '@prisma/client';

import { TimetableService } from './timetable.service';
import { DatabaseService } from '../database/database.service';
import { NotificationService } from '../notification/notification.service';

describe('TimetableService', () => {
  let service: TimetableService;
  let databaseService: typeof mockDatabaseService;

  const mockDatabaseService = {
    employee: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
    },
    subDepartment: {
      findUnique: jest.fn(),
    },
    timetable: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    timetableEntry: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    classroomBooking: {
      findFirst: jest.fn(),
      create: jest.fn(),
    },
  };

  const mockNotificationService = {
    create: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        TimetableService,
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

    service = moduleRef.get<TimetableService>(TimetableService);
    databaseService = moduleRef.get(DatabaseService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should throw ForbiddenException if user is not found', async () => {
      mockDatabaseService.employee.findUnique.mockResolvedValue(null);

      await expect(
        service.create(1, 999, '2026-01-01', '2026-06-01'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw ForbiddenException if STAFF tries to create timetable', async () => {
      mockDatabaseService.employee.findUnique.mockResolvedValue({
        id: 10,
        role: Role.STAFF,
      });

      await expect(
        service.create(1, 10, '2026-01-01', '2026-06-01'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should create timetable when user is ADMIN or MANAGER', async () => {
      mockDatabaseService.employee.findUnique.mockResolvedValue({
        id: 1,
        role: Role.ADMIN,
      });
      mockDatabaseService.subDepartment.findUnique.mockResolvedValue({
        id: 5,
        name: 'CS Sub-Dept',
      });
      const mockCreated = {
        id: 100,
        subDepartmentId: 5,
        createdById: 1,
      };
      mockDatabaseService.timetable.create.mockResolvedValue(mockCreated);

      const result = await service.create(5, 1, '2026-01-01', '2026-06-01');

      expect(databaseService.timetable.create).toHaveBeenCalled();
      expect(result).toEqual(mockCreated);
    });
  });

  describe('findOne', () => {
    it('should throw NotFoundException if timetable does not exist', async () => {
      mockDatabaseService.employee.findUnique.mockResolvedValue({
        id: 1,
        role: Role.ADMIN,
      });
      mockDatabaseService.timetable.findUnique.mockResolvedValue(null);

      await expect(service.findOne(999, 1)).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
