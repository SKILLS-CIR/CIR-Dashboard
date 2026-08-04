import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';

import { SemreportService } from './semreport.service';
import { DatabaseService } from '../database/database.service';
import { NotificationService } from '../notification/notification.service';

describe('SemreportService', () => {
  let service: SemreportService;
  let databaseService: typeof mockDatabaseService;
  let notificationService: typeof mockNotificationService;

  const mockDatabaseService = {
    semReport: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    semReportItem: {
      deleteMany: jest.fn(),
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
        SemreportService,
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

    service = moduleRef.get<SemreportService>(SemreportService);
    databaseService = moduleRef.get(DatabaseService);
    notificationService = moduleRef.get(NotificationService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should throw BadRequestException if batch item name contains lowercase letters', async () => {
      const dto: any = {
        semesterStartDate: '2026-01-01',
        semesterEndDate: '2026-06-01',
        status: 'DRAFT',
        items: [{ type: 'BATCH', name: 'batch2026' }],
      };

      await expect(service.create(10, dto)).rejects.toThrow(BadRequestException);
      await expect(service.create(10, dto)).rejects.toThrow(
        'Batch name "batch2026" must be in uppercase (letters, numbers, spaces only)',
      );
    });

    it('should create draft sem report when status is DRAFT', async () => {
      const dto: any = {
        semesterStartDate: '2026-01-01',
        semesterEndDate: '2026-06-01',
        status: 'DRAFT',
        items: [{ type: 'BATCH', name: 'BATCH 2026' }],
      };
      const mockCreated = { id: 1, status: 'DRAFT', staffId: 10 };
      mockDatabaseService.semReport.create.mockResolvedValue(mockCreated);

      const result = await service.create(10, dto);

      expect(databaseService.semReport.create).toHaveBeenCalled();
      expect(notificationService.create).not.toHaveBeenCalled();
      expect(result).toEqual(mockCreated);
    });

    it('should create sem report under manager review and notify manager when status is SUBMITTED', async () => {
      const dto: any = {
        semesterStartDate: '2026-01-01',
        semesterEndDate: '2026-06-01',
        status: 'SUBMITTED',
        items: [],
      };
      const mockCreated = { id: 1, status: 'UNDER_MANAGER_REVIEW', staffId: 10 };
      mockDatabaseService.semReport.create.mockResolvedValue(mockCreated);
      mockDatabaseService.employee.findUnique.mockResolvedValue({
        name: 'John Staff',
        subDepartmentId: 5,
      });
      mockDatabaseService.subDepartment.findUnique.mockResolvedValue({
        managerId: 2,
      });

      const result = await service.create(10, dto);

      expect(notificationService.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 2,
          type: 'SEM_REPORT_SUBMITTED',
          entityId: 1,
        }),
      );
      expect(result).toEqual(mockCreated);
    });
  });

  describe('update', () => {
    it('should throw NotFoundException when report does not exist', async () => {
      mockDatabaseService.semReport.findUnique.mockResolvedValue(null);

      await expect(service.update(10, 999, {} as any)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ForbiddenException if user updates another staff report', async () => {
      mockDatabaseService.semReport.findUnique.mockResolvedValue({
        id: 1,
        staffId: 50,
        status: 'DRAFT',
      });

      await expect(service.update(10, 1, {} as any)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should throw BadRequestException if report is not DRAFT or REJECTED', async () => {
      mockDatabaseService.semReport.findUnique.mockResolvedValue({
        id: 1,
        staffId: 10,
        status: 'UNDER_MANAGER_REVIEW',
      });

      await expect(service.update(10, 1, {} as any)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('managerReview', () => {
    it('should throw NotFoundException if report is not found', async () => {
      mockDatabaseService.semReport.findUnique.mockResolvedValue(null);

      await expect(
        service.managerReview(2, 999, { action: 'APPROVE' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if report status is not UNDER_MANAGER_REVIEW', async () => {
      mockDatabaseService.semReport.findUnique.mockResolvedValue({
        id: 1,
        status: 'DRAFT',
      });

      await expect(
        service.managerReview(2, 1, { action: 'APPROVE' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when rejecting without rejectionReason', async () => {
      mockDatabaseService.semReport.findUnique.mockResolvedValue({
        id: 1,
        status: 'UNDER_MANAGER_REVIEW',
        staff: { id: 10, subDepartmentId: 5 },
      });
      mockDatabaseService.subDepartment.findUnique.mockResolvedValue({
        id: 5,
        managerId: 2,
      });

      await expect(
        service.managerReview(2, 1, { action: 'REJECT' }),
      ).rejects.toThrow('Rejection reason is mandatory when rejecting a report');
    });

    it('should update status to UNDER_ADMIN_REVIEW on APPROVE', async () => {
      mockDatabaseService.semReport.findUnique.mockResolvedValue({
        id: 1,
        status: 'UNDER_MANAGER_REVIEW',
        staff: { id: 10, subDepartmentId: 5 },
      });
      mockDatabaseService.subDepartment.findUnique.mockResolvedValue({
        id: 5,
        managerId: 2,
      });
      mockDatabaseService.semReport.update.mockResolvedValue({
        id: 1,
        status: 'UNDER_ADMIN_REVIEW',
      });
      mockDatabaseService.employee.findMany.mockResolvedValue([{ id: 100 }]);

      const result = await service.managerReview(2, 1, { action: 'APPROVE' });

      expect(databaseService.semReport.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: 'UNDER_ADMIN_REVIEW' }),
        }),
      );
      expect(result.status).toBe('UNDER_ADMIN_REVIEW');
    });
  });

  describe('adminReview', () => {
    it('should throw BadRequestException when rejecting without reason', async () => {
      mockDatabaseService.semReport.findUnique.mockResolvedValue({
        id: 1,
        status: 'UNDER_ADMIN_REVIEW',
      });

      await expect(
        service.adminReview(100, 1, { action: 'REJECT' }),
      ).rejects.toThrow('Rejection reason is mandatory when rejecting a report');
    });

    it('should update status to APPROVED on admin APPROVE', async () => {
      mockDatabaseService.semReport.findUnique.mockResolvedValue({
        id: 1,
        staffId: 10,
        status: 'UNDER_ADMIN_REVIEW',
      });
      mockDatabaseService.semReport.update.mockResolvedValue({
        id: 1,
        status: 'APPROVED',
      });

      const result = await service.adminReview(100, 1, { action: 'APPROVE' });

      expect(databaseService.semReport.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: 'APPROVED' }),
        }),
      );
      expect(result.status).toBe('APPROVED');
    });
  });

  describe('delete', () => {
    it('should throw BadRequestException when attempting to delete non-DRAFT report', async () => {
      mockDatabaseService.semReport.findUnique.mockResolvedValue({
        id: 1,
        staffId: 10,
        status: 'APPROVED',
      });

      await expect(service.delete(10, 1)).rejects.toThrow(
        'Only draft reports can be deleted',
      );
    });

    it('should successfully delete DRAFT report', async () => {
      mockDatabaseService.semReport.findUnique.mockResolvedValue({
        id: 1,
        staffId: 10,
        status: 'DRAFT',
      });
      mockDatabaseService.semReport.delete.mockResolvedValue({ id: 1 });

      const result = await service.delete(10, 1);

      expect(databaseService.semReport.delete).toHaveBeenCalledWith({
        where: { id: 1 },
      });
      expect(result).toEqual({ id: 1 });
    });
  });
});
