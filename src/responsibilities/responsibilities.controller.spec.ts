import { Test, TestingModule } from '@nestjs/testing';

import { ResponsibilitiesController } from './responsibilities.controller';
import { ResponsibilitiesService } from './responsibilities.service';

describe('ResponsibilitiesController', () => {
  let controller: ResponsibilitiesController;
  let service: ResponsibilitiesService;

  const mockResponsibilitiesService = {
    createWithDateValidation: jest.fn(),
    findAllScoped: jest.fn(),
    getActiveForDate: jest.fn(),
    findOne: jest.fn(),
    getAssignedEmployees: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const moduleRef: TestingModule = await Test.createTestingModule({
      controllers: [ResponsibilitiesController],
      providers: [
        {
          provide: ResponsibilitiesService,
          useValue: mockResponsibilitiesService,
        },
      ],
    }).compile();

    controller = moduleRef.get<ResponsibilitiesController>(
      ResponsibilitiesController,
    );
    service = moduleRef.get<ResponsibilitiesService>(
      ResponsibilitiesService,
    );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should extract dates and delegate to service.createWithDateValidation', async () => {
      const body: any = {
        title: 'Task A',
        startDate: '2026-08-01',
        endDate: '2026-08-10',
        isStaffCreated: false,
      };
      const req = {
        user: { id: 1, role: 'MANAGER', subDepartmentId: 5 },
      };
      mockResponsibilitiesService.createWithDateValidation.mockResolvedValue({ id: 100 });

      const result = await controller.create(body, req);

      expect(service.createWithDateValidation).toHaveBeenCalledWith(
        { title: 'Task A' },
        1,
        'MANAGER',
        5,
        new Date('2026-08-01'),
        new Date('2026-08-10'),
        false,
      );
      expect(result).toEqual({ id: 100 });
    });
  });

  describe('findAll', () => {
    it('should call service.findAllScoped with includeExpired boolean', () => {
      const req = { user: { id: 1, role: 'MANAGER', subDepartmentId: 5 } };
      mockResponsibilitiesService.findAllScoped.mockReturnValue([]);

      const result = controller.findAll('true', req);

      expect(service.findAllScoped).toHaveBeenCalledWith(1, 'MANAGER', 5, true);
      expect(result).toEqual([]);
    });
  });

  describe('getActiveForDate', () => {
    it('should throw error if date string is invalid format', () => {
      const req = { user: { id: 1, role: 'STAFF', subDepartmentId: 5 } };

      expect(() => controller.getActiveForDate('invalid-date', req)).toThrow(
        'Invalid date format. Use YYYY-MM-DD',
      );
    });

    it('should call service.getActiveForDate with parsed date', () => {
      const req = { user: { id: 1, role: 'STAFF', subDepartmentId: 5 } };
      mockResponsibilitiesService.getActiveForDate.mockReturnValue([]);

      const result = controller.getActiveForDate('2026-08-04', req);

      expect(service.getActiveForDate).toHaveBeenCalledWith(
        1,
        'STAFF',
        5,
        new Date('2026-08-04'),
      );
      expect(result).toEqual([]);
    });
  });

  describe('findOne', () => {
    it('should parse string id and call service.findOne', () => {
      mockResponsibilitiesService.findOne.mockReturnValue({ id: 1 });

      const result = controller.findOne('1');

      expect(service.findOne).toHaveBeenCalledWith(1);
      expect(result).toEqual({ id: 1 });
    });
  });

  describe('getAssignedEmployees', () => {
    it('should parse string id and call service.getAssignedEmployees', () => {
      mockResponsibilitiesService.getAssignedEmployees.mockReturnValue([]);

      const result = controller.getAssignedEmployees('1');

      expect(service.getAssignedEmployees).toHaveBeenCalledWith(1);
      expect(result).toEqual([]);
    });
  });

  describe('update', () => {
    it('should parse string id and call service.update with dto', () => {
      const dto: any = { title: 'Updated' };
      mockResponsibilitiesService.update.mockReturnValue({ id: 1, title: 'Updated' });

      const result = controller.update('1', dto);

      expect(service.update).toHaveBeenCalledWith(1, dto);
      expect(result).toEqual({ id: 1, title: 'Updated' });
    });
  });

  describe('remove', () => {
    it('should parse string id and call service.remove', () => {
      mockResponsibilitiesService.remove.mockReturnValue({ id: 1 });

      const result = controller.remove('1');

      expect(service.remove).toHaveBeenCalledWith(1);
      expect(result).toEqual({ id: 1 });
    });
  });
});
