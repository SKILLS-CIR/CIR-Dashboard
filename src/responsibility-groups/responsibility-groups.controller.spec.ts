import { Test, TestingModule } from '@nestjs/testing';

import { ResponsibilityGroupsController } from './responsibility-groups.controller';
import { ResponsibilityGroupsService } from './responsibility-groups.service';
import {
  CreateResponsibilityGroupDto,
  UpdateResponsibilityGroupDto,
  AddResponsibilitiesToGroupDto,
  AssignGroupToStaffDto,
} from './dto';

describe('ResponsibilityGroupsController', () => {
  let controller: ResponsibilityGroupsController;
  let service: ResponsibilityGroupsService;

  const mockResponsibilityGroupsService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    addResponsibilities: jest.fn(),
    removeResponsibilityFromGroup: jest.fn(),
    assignToStaff: jest.fn(),
    getAssignedStaff: jest.fn(),
    unassignFromStaff: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const moduleRef: TestingModule = await Test.createTestingModule({
      controllers: [ResponsibilityGroupsController],
      providers: [
        {
          provide: ResponsibilityGroupsService,
          useValue: mockResponsibilityGroupsService,
        },
      ],
    }).compile();

    controller = moduleRef.get<ResponsibilityGroupsController>(
      ResponsibilityGroupsController,
    );
    service = moduleRef.get<ResponsibilityGroupsService>(
      ResponsibilityGroupsService,
    );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should delegate to service.create with DTO and user context', async () => {
      const dto: CreateResponsibilityGroupDto = {
        name: 'Group A',
        cycle: 'DAILY',
      };
      const req = {
        user: { id: 1, role: 'MANAGER', subDepartmentId: 5 },
      };
      mockResponsibilityGroupsService.create.mockResolvedValue({ id: 10, ...dto });

      const result = await controller.create(dto, req);

      expect(service.create).toHaveBeenCalledWith(dto, 1, 'MANAGER', 5);
      expect(result).toEqual({ id: 10, ...dto });
    });
  });

  describe('findAll', () => {
    it('should delegate to service.findAll with user context', async () => {
      const req = {
        user: { id: 1, role: 'MANAGER', subDepartmentId: 5 },
      };
      mockResponsibilityGroupsService.findAll.mockResolvedValue([]);

      const result = await controller.findAll(req);

      expect(service.findAll).toHaveBeenCalledWith(1, 'MANAGER', 5);
      expect(result).toEqual([]);
    });
  });

  describe('findOne', () => {
    it('should pass parsed id and user context to service.findOne', async () => {
      const req = {
        user: { id: 1, role: 'MANAGER', subDepartmentId: 5 },
      };
      mockResponsibilityGroupsService.findOne.mockResolvedValue({ id: 10 });

      const result = await controller.findOne(10, req);

      expect(service.findOne).toHaveBeenCalledWith(10, 1, 'MANAGER', 5);
      expect(result).toEqual({ id: 10 });
    });
  });

  describe('update', () => {
    it('should pass parsed id, DTO, and user context to service.update', async () => {
      const dto: UpdateResponsibilityGroupDto = { name: 'Updated Group' };
      const req = {
        user: { id: 1, role: 'MANAGER', subDepartmentId: 5 },
      };
      mockResponsibilityGroupsService.update.mockResolvedValue({ id: 10, name: 'Updated Group' });

      const result = await controller.update(10, dto, req);

      expect(service.update).toHaveBeenCalledWith(10, dto, 1, 'MANAGER', 5);
      expect(result).toEqual({ id: 10, name: 'Updated Group' });
    });
  });

  describe('remove', () => {
    it('should pass parsed id and user context to service.remove', async () => {
      const req = {
        user: { id: 1, role: 'MANAGER', subDepartmentId: 5 },
      };
      mockResponsibilityGroupsService.remove.mockResolvedValue({ id: 10 });

      const result = await controller.remove(10, req);

      expect(service.remove).toHaveBeenCalledWith(10, 1, 'MANAGER', 5);
      expect(result).toEqual({ id: 10 });
    });
  });

  describe('addResponsibilities', () => {
    it('should pass group id and DTO to service.addResponsibilities', async () => {
      const addDto: AddResponsibilitiesToGroupDto = { responsibilityIds: [1, 2] };
      const req = {
        user: { id: 1, role: 'MANAGER', subDepartmentId: 5 },
      };
      mockResponsibilityGroupsService.addResponsibilities.mockResolvedValue({ count: 2 });

      const result = await controller.addResponsibilities(10, addDto, req);

      expect(service.addResponsibilities).toHaveBeenCalledWith(10, addDto, 1, 'MANAGER', 5);
      expect(result).toEqual({ count: 2 });
    });
  });

  describe('removeResponsibility', () => {
    it('should pass groupId and responsibilityId to service.removeResponsibilityFromGroup', async () => {
      const req = {
        user: { id: 1, role: 'MANAGER', subDepartmentId: 5 },
      };
      mockResponsibilityGroupsService.removeResponsibilityFromGroup.mockResolvedValue({ success: true });

      const result = await controller.removeResponsibility(10, 2, req);

      expect(service.removeResponsibilityFromGroup).toHaveBeenCalledWith(10, 2, 1, 'MANAGER', 5);
      expect(result).toEqual({ success: true });
    });
  });

  describe('assignToStaff', () => {
    it('should pass assignDto and user context to service.assignToStaff', async () => {
      const assignDto: AssignGroupToStaffDto = { staffIds: [100, 101] };
      const req = {
        user: { id: 1, role: 'MANAGER', subDepartmentId: 5 },
      };
      mockResponsibilityGroupsService.assignToStaff.mockResolvedValue({ assigned: 2 });

      const result = await controller.assignToStaff(10, assignDto, req);

      expect(service.assignToStaff).toHaveBeenCalledWith(10, assignDto, 1, 'MANAGER', 5);
      expect(result).toEqual({ assigned: 2 });
    });
  });

  describe('getAssignedStaff', () => {
    it('should pass group id and user context to service.getAssignedStaff', async () => {
      const req = {
        user: { id: 1, role: 'MANAGER', subDepartmentId: 5 },
      };
      mockResponsibilityGroupsService.getAssignedStaff.mockResolvedValue([]);

      const result = await controller.getAssignedStaff(10, req);

      expect(service.getAssignedStaff).toHaveBeenCalledWith(10, 1, 'MANAGER', 5);
      expect(result).toEqual([]);
    });
  });

  describe('unassignFromStaff', () => {
    it('should pass groupId and staffId to service.unassignFromStaff', async () => {
      const req = {
        user: { id: 1, role: 'MANAGER', subDepartmentId: 5 },
      };
      mockResponsibilityGroupsService.unassignFromStaff.mockResolvedValue({ success: true });

      const result = await controller.unassignFromStaff(10, 100, req);

      expect(service.unassignFromStaff).toHaveBeenCalledWith(10, 100, 1, 'MANAGER', 5);
      expect(result).toEqual({ success: true });
    });
  });
});
