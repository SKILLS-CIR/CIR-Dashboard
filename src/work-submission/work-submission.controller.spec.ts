import { Test, TestingModule } from '@nestjs/testing';

import { WorkSubmissionController } from './work-submission.controller';
import { WorkSubmissionService } from './work-submission.service';
import { VerifySubmissionDto } from './dto/verify-submission.dto';

describe('WorkSubmissionController', () => {
  let controller: WorkSubmissionController;
  let service: WorkSubmissionService;

  const mockWorkSubmissionService = {
    createProtected: jest.fn(),
    findAllScoped: jest.fn(),
    getDailySubmissions: jest.fn(),
    getDailyTotalHours: jest.fn(),
    getCalendarView: jest.fn(),
    findOneProtected: jest.fn(),
    updateProtected: jest.fn(),
    remove: jest.fn(),
    resubmitRejected: jest.fn(),
    verifySubmission: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const moduleRef: TestingModule = await Test.createTestingModule({
      controllers: [WorkSubmissionController],
      providers: [
        {
          provide: WorkSubmissionService,
          useValue: mockWorkSubmissionService,
        },
      ],
    }).compile();

    controller = moduleRef.get<WorkSubmissionController>(
      WorkSubmissionController,
    );
    service = moduleRef.get<WorkSubmissionService>(
      WorkSubmissionService,
    );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should delegate to service.createProtected with user context', async () => {
      const dto: any = { hoursWorked: 4 };
      const req = { user: { id: 10, role: 'STAFF' } };
      mockWorkSubmissionService.createProtected.mockResolvedValue({ id: 1 });

      const result = await controller.create(dto, req);

      expect(service.createProtected).toHaveBeenCalledWith(dto, 10, 'STAFF');
      expect(result).toEqual({ id: 1 });
    });
  });

  describe('findAll', () => {
    it('should pass parsed query filters to service.findAllScoped', () => {
      const req = { user: { id: 10, role: 'STAFF', subDepartmentId: 2 } };
      mockWorkSubmissionService.findAllScoped.mockReturnValue([]);

      const result = controller.findAll('10', '2', '1', '2026-08-04', req);

      expect(service.findAllScoped).toHaveBeenCalledWith(
        10,
        'STAFF',
        2,
        10,
        2,
        1,
        new Date('2026-08-04'),
      );
      expect(result).toEqual([]);
    });
  });

  describe('getToday', () => {
    it('should call service.getDailySubmissions for current date', async () => {
      const req = { user: { id: 10, role: 'STAFF', subDepartmentId: 2 } };
      mockWorkSubmissionService.getDailySubmissions.mockResolvedValue([]);

      const result = await controller.getToday(req);

      expect(service.getDailySubmissions).toHaveBeenCalledWith(
        10,
        'STAFF',
        2,
        expect.any(Date),
      );
      expect(result).toEqual([]);
    });
  });

  describe('getDailySubmissions', () => {
    it('should throw error if date string is invalid', async () => {
      const req = { user: { id: 10, role: 'STAFF', subDepartmentId: 2 } };

      await expect(
        controller.getDailySubmissions('invalid-date', req),
      ).rejects.toThrow('Invalid date format. Use YYYY-MM-DD');
    });

    it('should call service.getDailySubmissions with parsed date', async () => {
      const req = { user: { id: 10, role: 'STAFF', subDepartmentId: 2 } };
      mockWorkSubmissionService.getDailySubmissions.mockResolvedValue([]);

      const result = await controller.getDailySubmissions('2026-08-04', req);

      expect(service.getDailySubmissions).toHaveBeenCalledWith(
        10,
        'STAFF',
        2,
        new Date('2026-08-04'),
      );
      expect(result).toEqual([]);
    });
  });

  describe('getDailyHours', () => {
    it('should throw error if STAFF tries to view hours of another staff', async () => {
      const req = { user: { id: 10, role: 'STAFF' } };

      await expect(
        controller.getDailyHours(99, '2026-08-04', req),
      ).rejects.toThrow('Staff can only view their own daily hours');
    });

    it('should call service.getDailyTotalHours for authorized user', async () => {
      const req = { user: { id: 10, role: 'STAFF' } };
      mockWorkSubmissionService.getDailyTotalHours.mockResolvedValue({
        totalHours: 4,
        verifiedHours: 4,
        pendingHours: 0,
      });

      const result = await controller.getDailyHours(10, '2026-08-04', req);

      expect(service.getDailyTotalHours).toHaveBeenCalledWith(
        10,
        new Date('2026-08-04'),
      );
      expect(result).toEqual({ totalHours: 4, verifiedHours: 4, pendingHours: 0 });
    });
  });

  describe('getCalendarView', () => {
    it('should throw error if STAFF tries to view another staff calendar', async () => {
      const req = { user: { id: 10, role: 'STAFF' } };

      await expect(
        controller.getCalendarView(99, '2026-08-01', '2026-08-31', req),
      ).rejects.toThrow('Staff can only view their own calendar');
    });

    it('should call service.getCalendarView for authorized request', async () => {
      const req = { user: { id: 10, role: 'STAFF' } };
      mockWorkSubmissionService.getCalendarView.mockResolvedValue([]);

      const result = await controller.getCalendarView(10, '2026-08-01', '2026-08-31', req);

      expect(service.getCalendarView).toHaveBeenCalledWith(
        10,
        new Date('2026-08-01'),
        new Date('2026-08-31'),
      );
      expect(result).toEqual([]);
    });
  });

  describe('findOne', () => {
    it('should call service.findOneProtected with parsed id and user context', () => {
      const req = { user: { id: 10, role: 'STAFF', subDepartmentId: 2 } };
      mockWorkSubmissionService.findOneProtected.mockReturnValue({ id: 1 });

      const result = controller.findOne(1, req);

      expect(service.findOneProtected).toHaveBeenCalledWith(1, 10, 'STAFF', 2);
      expect(result).toEqual({ id: 1 });
    });
  });

  describe('update', () => {
    it('should call service.updateProtected with dto and user context', () => {
      const dto: any = { hoursWorked: 5 };
      const req = { user: { id: 10, role: 'STAFF' } };
      mockWorkSubmissionService.updateProtected.mockReturnValue({ id: 1, hoursWorked: 5 });

      const result = controller.update(1, dto, req);

      expect(service.updateProtected).toHaveBeenCalledWith(1, dto, 10, 'STAFF');
      expect(result).toEqual({ id: 1, hoursWorked: 5 });
    });
  });

  describe('remove', () => {
    it('should call service.remove with parsed id', () => {
      mockWorkSubmissionService.remove.mockReturnValue({ id: 1 });

      const result = controller.remove(1);

      expect(service.remove).toHaveBeenCalledWith(1);
      expect(result).toEqual({ id: 1 });
    });
  });

  describe('resubmit', () => {
    it('should call service.resubmitRejected with user id and dto', async () => {
      const resubmitDto = { hoursWorked: 6, staffComment: 'Corrected' };
      const req = { user: { id: 10 } };
      mockWorkSubmissionService.resubmitRejected.mockResolvedValue({ id: 1, status: 'SUBMITTED' });

      const result = await controller.resubmit(1, resubmitDto, req);

      expect(service.resubmitRejected).toHaveBeenCalledWith(1, 10, resubmitDto);
      expect(result).toEqual({ id: 1, status: 'SUBMITTED' });
    });
  });

  describe('verify', () => {
    it('should call service.verifySubmission with verifyDto details', async () => {
      const verifyDto: VerifySubmissionDto = { approved: true, managerComment: 'Approved' };
      const req = { user: { id: 2, role: 'MANAGER', subDepartmentId: 5 } };
      mockWorkSubmissionService.verifySubmission.mockResolvedValue({ id: 1, status: 'VERIFIED' });

      const result = await controller.verify(1, verifyDto, req);

      expect(service.verifySubmission).toHaveBeenCalledWith(
        1,
        2,
        'MANAGER',
        5,
        'Approved',
        true,
      );
      expect(result).toEqual({ id: 1, status: 'VERIFIED' });
    });
  });
});
