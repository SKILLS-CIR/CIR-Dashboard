import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, ForbiddenException } from '@nestjs/common';

import { AssignmentController } from './assignment.controller';
import { AssignmentService } from './assignment.service';
import { DatabaseService } from 'src/database/database.service';

describe('AssignmentController', () => {
  let controller: AssignmentController;
  let assignmentService: AssignmentService;
  let databaseService: DatabaseService;

  const mockAssignmentService = {
    create: jest.fn(),
    findAllScoped: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  const mockDatabaseService = {
    responsibility: {
      findUnique: jest.fn(),
    },
    employee: {
      findUnique: jest.fn(),
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const moduleRef: TestingModule = await Test.createTestingModule({
      controllers: [AssignmentController],
      providers: [
        {
          provide: AssignmentService,
          useValue: mockAssignmentService,
        },
        {
          provide: DatabaseService,
          useValue: mockDatabaseService,
        },
      ],
    }).compile();

    controller = moduleRef.get<AssignmentController>(AssignmentController);
    assignmentService = moduleRef.get<AssignmentService>(AssignmentService);
    databaseService = moduleRef.get<DatabaseService>(DatabaseService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should delegate to assignmentService.create for ADMIN role', async () => {
      const dto: any = {
        responsibility: { connect: { id: 1 } },
        staff: { connect: { id: 10 } },
      };
      const req = {
        user: { id: 1, role: 'ADMIN', subDepartmentId: null },
      };
      const mockResult = { id: 100, ...dto };
      mockAssignmentService.create.mockResolvedValue(mockResult);

      const result = await controller.create(dto, req);

      expect(assignmentService.create).toHaveBeenCalledWith(dto);
      expect(result).toEqual(mockResult);
    });

    describe('MANAGER validation rules', () => {
      it('should throw ForbiddenException if manager has no subDepartmentId', async () => {
        const dto: any = {};
        const req = { user: { id: 2, role: 'MANAGER', subDepartmentId: null } };

        await expect(controller.create(dto, req)).rejects.toThrow(
          ForbiddenException,
        );
        await expect(controller.create(dto, req)).rejects.toThrow(
          'Manager must be assigned to a sub-department to create assignments',
        );
      });

      it('should throw BadRequestException if responsibility ID is missing', async () => {
        const dto: any = { responsibility: {} };
        const req = { user: { id: 2, role: 'MANAGER', subDepartmentId: 5 } };

        await expect(controller.create(dto, req)).rejects.toThrow(
          BadRequestException,
        );
        await expect(controller.create(dto, req)).rejects.toThrow(
          'Responsibility ID is required',
        );
      });

      it('should throw BadRequestException if responsibility does not exist', async () => {
        const dto: any = { responsibility: { connect: { id: 99 } } };
        const req = { user: { id: 2, role: 'MANAGER', subDepartmentId: 5 } };
        (databaseService.responsibility.findUnique as jest.Mock).mockResolvedValue(
          null,
        );

        await expect(controller.create(dto, req)).rejects.toThrow(
          BadRequestException,
        );
        await expect(controller.create(dto, req)).rejects.toThrow(
          'Responsibility not found',
        );
      });

      it('should throw ForbiddenException if responsibility sub-department does not match manager', async () => {
        const dto: any = { responsibility: { connect: { id: 1 } } };
        const req = { user: { id: 2, role: 'MANAGER', subDepartmentId: 5 } };
        (databaseService.responsibility.findUnique as jest.Mock).mockResolvedValue(
          { subDepartmentId: 99 },
        );

        await expect(controller.create(dto, req)).rejects.toThrow(
          ForbiddenException,
        );
        await expect(controller.create(dto, req)).rejects.toThrow(
          'You can only create assignments for responsibilities in your sub-department',
        );
      });

      it('should throw BadRequestException if staff does not exist', async () => {
        const dto: any = {
          responsibility: { connect: { id: 1 } },
          staff: { connect: { id: 10 } },
        };
        const req = { user: { id: 2, role: 'MANAGER', subDepartmentId: 5 } };
        (databaseService.responsibility.findUnique as jest.Mock).mockResolvedValue(
          { subDepartmentId: 5 },
        );
        (databaseService.employee.findUnique as jest.Mock).mockResolvedValue(
          null,
        );

        await expect(controller.create(dto, req)).rejects.toThrow(
          BadRequestException,
        );
        await expect(controller.create(dto, req)).rejects.toThrow(
          'Staff member not found',
        );
      });

      it('should throw BadRequestException if assigned user role is not STAFF', async () => {
        const dto: any = {
          responsibility: { connect: { id: 1 } },
          staff: { connect: { id: 10 } },
        };
        const req = { user: { id: 2, role: 'MANAGER', subDepartmentId: 5 } };
        (databaseService.responsibility.findUnique as jest.Mock).mockResolvedValue(
          { subDepartmentId: 5 },
        );
        (databaseService.employee.findUnique as jest.Mock).mockResolvedValue(
          { role: 'MANAGER', subDepartmentId: 5 },
        );

        await expect(controller.create(dto, req)).rejects.toThrow(
          BadRequestException,
        );
        await expect(controller.create(dto, req)).rejects.toThrow(
          'Can only assign responsibilities to STAFF members',
        );
      });

      it('should throw ForbiddenException if staff sub-department does not match manager', async () => {
        const dto: any = {
          responsibility: { connect: { id: 1 } },
          staff: { connect: { id: 10 } },
        };
        const req = { user: { id: 2, role: 'MANAGER', subDepartmentId: 5 } };
        (databaseService.responsibility.findUnique as jest.Mock).mockResolvedValue(
          { subDepartmentId: 5 },
        );
        (databaseService.employee.findUnique as jest.Mock).mockResolvedValue(
          { role: 'STAFF', subDepartmentId: 99 },
        );

        await expect(controller.create(dto, req)).rejects.toThrow(
          ForbiddenException,
        );
        await expect(controller.create(dto, req)).rejects.toThrow(
          'You can only assign responsibilities to staff in your sub-department',
        );
      });

      it('should successfully create assignment when manager validation succeeds', async () => {
        const dto: any = {
          responsibility: { connect: { id: 1 } },
          staff: { connect: { id: 10 } },
        };
        const req = { user: { id: 2, role: 'MANAGER', subDepartmentId: 5 } };
        (databaseService.responsibility.findUnique as jest.Mock).mockResolvedValue(
          { subDepartmentId: 5 },
        );
        (databaseService.employee.findUnique as jest.Mock).mockResolvedValue(
          { role: 'STAFF', subDepartmentId: 5 },
        );
        mockAssignmentService.create.mockResolvedValue({ id: 100 });

        const result = await controller.create(dto, req);

        expect(assignmentService.create).toHaveBeenCalledWith(dto);
        expect(result).toEqual({ id: 100 });
      });
    });
  });

  describe('findAll', () => {
    it('should call assignmentService.findAllScoped with correct arguments', () => {
      const req = { user: { id: 10, role: 'STAFF', subDepartmentId: 2 } };
      mockAssignmentService.findAllScoped.mockReturnValue([]);

      controller.findAll('10', '5', 'PENDING', req);

      expect(assignmentService.findAllScoped).toHaveBeenCalledWith(
        10,
        'STAFF',
        2,
        10,
        5,
        'PENDING',
      );
    });
  });

  describe('findOne', () => {
    it('should call assignmentService.findOne with parsed id', () => {
      mockAssignmentService.findOne.mockReturnValue({ id: 1 });

      const result = controller.findOne('1');

      expect(assignmentService.findOne).toHaveBeenCalledWith(1);
      expect(result).toEqual({ id: 1 });
    });
  });

  describe('update', () => {
    it('should call assignmentService.update with parsed id and dto', () => {
      const dto: any = { status: 'COMPLETED' };
      mockAssignmentService.update.mockReturnValue({ id: 1, ...dto });

      const result = controller.update('1', dto);

      expect(assignmentService.update).toHaveBeenCalledWith(1, dto);
      expect(result).toEqual({ id: 1, ...dto });
    });
  });

  describe('remove', () => {
    it('should call assignmentService.remove with parsed id', () => {
      mockAssignmentService.remove.mockReturnValue({ id: 1 });

      const result = controller.remove('1');

      expect(assignmentService.remove).toHaveBeenCalledWith(1);
      expect(result).toEqual({ id: 1 });
    });
  });
});
