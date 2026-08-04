import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { WorkSubmissionService } from './work-submission.service';
import { DatabaseService } from '../database/database.service';
import { NotificationService } from '../notification/notification.service';

describe('WorkSubmissionService', () => {
  let service: WorkSubmissionService;
  let databaseService: typeof mockDatabaseService;
  let notificationService: typeof mockNotificationService;

  const mockDatabaseService = {
    workSubmission: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    responsibilityAssignment: {
      findUnique: jest.fn(),
    },
    appSettings: {
      findUnique: jest.fn(),
    },
    employee: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
    },
    subDepartment: {
      findUnique: jest.fn(),
    },
  };

  const mockNotificationService = {
    create: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        WorkSubmissionService,
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

    service = moduleRef.get<WorkSubmissionService>(WorkSubmissionService);
    databaseService = moduleRef.get(DatabaseService);
    notificationService = moduleRef.get(NotificationService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create and return work submission', async () => {
      const dto: any = { hoursWorked: 4, staffId: 10, assignmentId: 1 };
      mockDatabaseService.workSubmission.create.mockResolvedValue({ id: 100, ...dto });

      const result = await service.create(dto);

      expect(databaseService.workSubmission.create).toHaveBeenCalledWith({ data: dto });
      expect(result).toEqual({ id: 100, ...dto });
    });

    it('should throw NotFoundException on Prisma P2025 error code', async () => {
      const dto: any = { hoursWorked: 4 };
      const prismaError = new Prisma.PrismaClientKnownRequestError('Not found', {
        code: 'P2025',
        clientVersion: '5.0',
      });
      mockDatabaseService.workSubmission.create.mockRejectedValue(prismaError);

      await expect(service.create(dto)).rejects.toThrow(NotFoundException);
      await expect(service.create(dto)).rejects.toThrow(
        'Referenced record not found. Ensure assignment and staff IDs exist.',
      );
    });

    it('should throw BadRequestException on Prisma P2002 duplicate error code', async () => {
      const dto: any = { hoursWorked: 4 };
      const prismaError = new Prisma.PrismaClientKnownRequestError('Duplicate', {
        code: 'P2002',
        clientVersion: '5.0',
      });
      mockDatabaseService.workSubmission.create.mockRejectedValue(prismaError);

      await expect(service.create(dto)).rejects.toThrow(BadRequestException);
      await expect(service.create(dto)).rejects.toThrow(
        'A work submission already exists for this assignment on this date.',
      );
    });
  });

  describe('findOneProtected', () => {
    it('should throw NotFoundException if submission does not exist', async () => {
      mockDatabaseService.workSubmission.findUnique.mockResolvedValue(null);

      await expect(
        service.findOneProtected(999, 10, 'STAFF', null),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if STAFF views another staff submission', async () => {
      mockDatabaseService.workSubmission.findUnique.mockResolvedValue({
        id: 1,
        staffId: 50,
      });

      await expect(
        service.findOneProtected(1, 10, 'STAFF', null),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should allow ADMIN to view any submission', async () => {
      const mockSubmission = { id: 1, staffId: 50 };
      mockDatabaseService.workSubmission.findUnique.mockResolvedValue(mockSubmission);

      const result = await service.findOneProtected(1, 1, 'ADMIN', null);

      expect(result).toEqual(mockSubmission);
    });
  });

  describe('verifySubmission', () => {
    it('should throw NotFoundException if submission is missing', async () => {
      mockDatabaseService.workSubmission.findUnique.mockResolvedValue(null);

      await expect(
        service.verifySubmission(999, 2, 'MANAGER', 5, 'Good', true),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if submission is already marked with same status', async () => {
      mockDatabaseService.workSubmission.findUnique.mockResolvedValue({
        id: 1,
        status: 'VERIFIED',
      });

      await expect(
        service.verifySubmission(1, 2, 'MANAGER', 5, 'Approved', true),
      ).rejects.toThrow('This submission is already marked as VERIFIED.');
    });

    it('should throw ForbiddenException if STAFF tries to verify', async () => {
      mockDatabaseService.workSubmission.findUnique.mockResolvedValue({
        id: 1,
        status: 'SUBMITTED',
      });

      await expect(
        service.verifySubmission(1, 10, 'STAFF', null, 'Comment', true),
      ).rejects.toThrow('Staff cannot verify submissions');
    });

    it('should throw ForbiddenException if MANAGER verifies their own submission', async () => {
      mockDatabaseService.workSubmission.findUnique.mockResolvedValue({
        id: 1,
        status: 'SUBMITTED',
        staffId: 2,
        assignment: {
          responsibility: { subDepartmentId: 5 },
        },
      });

      await expect(
        service.verifySubmission(1, 2, 'MANAGER', 5, 'Comment', true),
      ).rejects.toThrow('Managers cannot verify their own submissions');
    });

    it('should update status and send notification on successful verification', async () => {
      mockDatabaseService.workSubmission.findUnique.mockResolvedValue({
        id: 1,
        status: 'SUBMITTED',
        staffId: 10,
        assignment: {
          responsibility: { subDepartmentId: 5 },
        },
      });
      mockDatabaseService.workSubmission.update.mockResolvedValue({
        id: 1,
        status: 'VERIFIED',
        staffId: 10,
        assignment: { responsibility: { title: 'Lab Prep' } },
      });

      const result = await service.verifySubmission(1, 2, 'MANAGER', 5, 'Great', true);

      expect(databaseService.workSubmission.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 1 },
          data: expect.objectContaining({ status: 'VERIFIED' }),
        }),
      );
      expect(notificationService.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 10,
          type: 'WORK_VERIFIED',
        }),
      );
      expect(result.status).toBe('VERIFIED');
    });
  });

  describe('resubmitRejected', () => {
    it('should throw ForbiddenException if non-owner attempts resubmission', async () => {
      mockDatabaseService.workSubmission.findUnique.mockResolvedValue({
        id: 1,
        staffId: 50,
        status: 'REJECTED',
      });

      await expect(
        service.resubmitRejected(1, 10, { hoursWorked: 5 }),
      ).rejects.toThrow('You can only resubmit your own work submissions');
    });

    it('should throw BadRequestException if submission is not in REJECTED status', async () => {
      mockDatabaseService.workSubmission.findUnique.mockResolvedValue({
        id: 1,
        staffId: 10,
        status: 'SUBMITTED',
      });

      await expect(
        service.resubmitRejected(1, 10, { hoursWorked: 5 }),
      ).rejects.toThrow('Only rejected submissions can be resubmitted. Current status: SUBMITTED');
    });

    it('should update status back to SUBMITTED and clear verification fields', async () => {
      mockDatabaseService.workSubmission.findUnique.mockResolvedValue({
        id: 1,
        staffId: 10,
        status: 'REJECTED',
        hoursWorked: 3,
      });
      mockDatabaseService.workSubmission.update.mockResolvedValue({
        id: 1,
        status: 'SUBMITTED',
        hoursWorked: 5,
      });

      const result = await service.resubmitRejected(1, 10, { hoursWorked: 5 });

      expect(databaseService.workSubmission.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 1 },
          data: expect.objectContaining({
            status: 'SUBMITTED',
            verifiedAt: null,
            verifiedById: null,
          }),
        }),
      );
      expect(result.status).toBe('SUBMITTED');
    });
  });

  describe('getDailyTotalHours', () => {
    it('should correctly sum verified and pending hours for staff on target date', async () => {
      mockDatabaseService.workSubmission.findMany.mockResolvedValue([
        { status: 'VERIFIED', hoursWorked: 4 },
        { status: 'SUBMITTED', hoursWorked: 2 },
        { status: 'REJECTED', hoursWorked: 3 },
      ]);

      const result = await service.getDailyTotalHours(10, new Date('2026-08-04'));

      expect(result).toEqual({
        totalHours: 6,
        verifiedHours: 4,
        pendingHours: 2,
      });
    });
  });
});
