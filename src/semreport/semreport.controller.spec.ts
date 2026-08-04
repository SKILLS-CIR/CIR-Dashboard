import { Test, TestingModule } from '@nestjs/testing';

import { SemreportController } from './semreport.controller';
import { SemreportService } from './semreport.service';
import { CreateSemreportDto } from './dto/create-semreport.dto';
import { UpdateSemreportDto } from './dto/update-semreport.dto';
import { ReviewSemreportDto } from './dto/review-semreport.dto';

describe('SemreportController', () => {
  let controller: SemreportController;
  let service: SemreportService;

  const mockSemreportService = {
    create: jest.fn(),
    getMyReports: jest.fn(),
    getReportsForManagerReview: jest.fn(),
    getReportsForAdminReview: jest.fn(),
    getByStaffId: jest.fn(),
    managerReview: jest.fn(),
    adminReview: jest.fn(),
    update: jest.fn(),
    getById: jest.fn(),
    delete: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const moduleRef: TestingModule = await Test.createTestingModule({
      controllers: [SemreportController],
      providers: [
        {
          provide: SemreportService,
          useValue: mockSemreportService,
        },
      ],
    }).compile();

    controller = moduleRef.get<SemreportController>(SemreportController);
    service = moduleRef.get<SemreportService>(SemreportService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should extract staff user id and call service.create', async () => {
      const dto: CreateSemreportDto = {
        semesterStartDate: '2026-01-01',
        semesterEndDate: '2026-06-01',
        items: [],
      };
      const req = { user: { id: 10 } };
      mockSemreportService.create.mockResolvedValue({ id: 1 });

      const result = await controller.create(req, dto);

      expect(service.create).toHaveBeenCalledWith(10, dto);
      expect(result).toEqual({ id: 1 });
    });
  });

  describe('getMyReports', () => {
    it('should call service.getMyReports with user id', async () => {
      const req = { user: { id: 10 } };
      mockSemreportService.getMyReports.mockResolvedValue([]);

      const result = await controller.getMyReports(req);

      expect(service.getMyReports).toHaveBeenCalledWith(10);
      expect(result).toEqual([]);
    });
  });

  describe('getManagerReports', () => {
    it('should call service.getReportsForManagerReview with manager id', async () => {
      const req = { user: { id: 2 } };
      mockSemreportService.getReportsForManagerReview.mockResolvedValue([]);

      const result = await controller.getManagerReports(req);

      expect(service.getReportsForManagerReview).toHaveBeenCalledWith(2);
      expect(result).toEqual([]);
    });
  });

  describe('getAdminReports', () => {
    it('should parse optional departmentId query param', async () => {
      mockSemreportService.getReportsForAdminReview.mockResolvedValue([]);

      const result = await controller.getAdminReports('5');

      expect(service.getReportsForAdminReview).toHaveBeenCalledWith(5);
      expect(result).toEqual([]);
    });
  });

  describe('getByStaffId', () => {
    it('should pass staffId and requester context to service.getByStaffId', async () => {
      const req = { user: { id: 2, role: 'MANAGER' } };
      mockSemreportService.getByStaffId.mockResolvedValue([]);

      const result = await controller.getByStaffId(req, 10);

      expect(service.getByStaffId).toHaveBeenCalledWith(10, 2, 'MANAGER');
      expect(result).toEqual([]);
    });
  });

  describe('managerReview', () => {
    it('should pass manager id, report id, and review dto to service.managerReview', async () => {
      const req = { user: { id: 2 } };
      const dto: ReviewSemreportDto = { action: 'APPROVE' };
      mockSemreportService.managerReview.mockResolvedValue({ id: 1, status: 'UNDER_ADMIN_REVIEW' });

      const result = await controller.managerReview(req, 1, dto);

      expect(service.managerReview).toHaveBeenCalledWith(2, 1, dto);
      expect(result).toEqual({ id: 1, status: 'UNDER_ADMIN_REVIEW' });
    });
  });

  describe('adminReview', () => {
    it('should pass admin id, report id, and review dto to service.adminReview', async () => {
      const req = { user: { id: 100 } };
      const dto: ReviewSemreportDto = { action: 'APPROVE' };
      mockSemreportService.adminReview.mockResolvedValue({ id: 1, status: 'APPROVED' });

      const result = await controller.adminReview(req, 1, dto);

      expect(service.adminReview).toHaveBeenCalledWith(100, 1, dto);
      expect(result).toEqual({ id: 1, status: 'APPROVED' });
    });
  });

  describe('update', () => {
    it('should pass staff id, report id, and update dto to service.update', async () => {
      const req = { user: { id: 10 } };
      const dto: UpdateSemreportDto = { status: 'SUBMITTED' };
      mockSemreportService.update.mockResolvedValue({ id: 1 });

      const result = await controller.update(req, 1, dto);

      expect(service.update).toHaveBeenCalledWith(10, 1, dto);
      expect(result).toEqual({ id: 1 });
    });
  });

  describe('getById', () => {
    it('should pass report id, requester id, and role to service.getById', async () => {
      const req = { user: { id: 10, role: 'STAFF' } };
      mockSemreportService.getById.mockResolvedValue({ id: 1 });

      const result = await controller.getById(req, 1);

      expect(service.getById).toHaveBeenCalledWith(1, 10, 'STAFF');
      expect(result).toEqual({ id: 1 });
    });
  });

  describe('delete', () => {
    it('should pass staff id and report id to service.delete', async () => {
      const req = { user: { id: 10 } };
      mockSemreportService.delete.mockResolvedValue({ id: 1 });

      const result = await controller.delete(req, 1);

      expect(service.delete).toHaveBeenCalledWith(10, 1);
      expect(result).toEqual({ id: 1 });
    });
  });
});
