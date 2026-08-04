import { Test, TestingModule } from '@nestjs/testing';

import { EmployeesController } from './employees.controller';
import { EmployeesService } from './employees.service';
import { ChangePasswordDto } from './dto/change-password.dto';

describe('EmployeesController', () => {
  let controller: EmployeesController;
  let service: EmployeesService;

  const mockEmployeesService = {
    create: jest.fn(),
    findAllScoped: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    changePassword: jest.fn(),
    resetPassword: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const moduleRef: TestingModule = await Test.createTestingModule({
      controllers: [EmployeesController],
      providers: [
        {
          provide: EmployeesService,
          useValue: mockEmployeesService,
        },
      ],
    }).compile();

    controller = moduleRef.get<EmployeesController>(EmployeesController);
    service = moduleRef.get<EmployeesService>(EmployeesService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should delegate to employeesService.create', async () => {
      const dto: any = { name: 'John Doe', email: 'john@example.com' };
      mockEmployeesService.create.mockResolvedValue({ id: 1, ...dto });

      const result = await controller.create(dto);

      expect(service.create).toHaveBeenCalledWith(dto);
      expect(result).toEqual({ id: 1, ...dto });
    });
  });

  describe('findAll', () => {
    it('should delegate to employeesService.findAllScoped with user context and role filter', async () => {
      const req = { user: { id: 10, role: 'MANAGER', subDepartmentId: 3 } };
      mockEmployeesService.findAllScoped.mockResolvedValue([]);

      const result = await controller.findAll('127.0.0.1', 'STAFF', req);

      expect(service.findAllScoped).toHaveBeenCalledWith(
        10,
        'MANAGER',
        3,
        'STAFF',
      );
      expect(result).toEqual([]);
    });
  });

  describe('findOne', () => {
    it('should parse string id and call employeesService.findOne', async () => {
      mockEmployeesService.findOne.mockResolvedValue({ id: 1 });

      const result = await controller.findOne('1');

      expect(service.findOne).toHaveBeenCalledWith(1);
      expect(result).toEqual({ id: 1 });
    });
  });

  describe('update', () => {
    it('should parse string id and call employeesService.update', async () => {
      const updateDto: any = { name: 'Updated' };
      mockEmployeesService.update.mockResolvedValue({ id: 1, ...updateDto });

      const result = await controller.update('1', updateDto);

      expect(service.update).toHaveBeenCalledWith(1, updateDto);
      expect(result).toEqual({ id: 1, ...updateDto });
    });
  });

  describe('remove', () => {
    it('should parse string id and call employeesService.remove', async () => {
      mockEmployeesService.remove.mockResolvedValue({ id: 1 });

      const result = await controller.remove('1');

      expect(service.remove).toHaveBeenCalledWith(1);
      expect(result).toEqual({ id: 1 });
    });
  });

  describe('changePassword', () => {
    it('should extract user id from request and call employeesService.changePassword', async () => {
      const req = { user: { id: 10 } };
      const dto: ChangePasswordDto = {
        currentPassword: 'oldPass123',
        newPassword: 'newPass123',
      };
      mockEmployeesService.changePassword.mockResolvedValue({ id: 10 });

      const result = await controller.changePassword(req, dto);

      expect(service.changePassword).toHaveBeenCalledWith(
        10,
        'oldPass123',
        'newPass123',
      );
      expect(result).toEqual({ id: 10 });
    });
  });

  describe('resetPassword', () => {
    it('should parse target user id and pass newPassword to employeesService.resetPassword', async () => {
      mockEmployeesService.resetPassword.mockResolvedValue({
        message: 'Password reset successfully',
      });

      const result = await controller.resetPassword('5', {
        newPassword: 'adminAssignedPass',
      });

      expect(service.resetPassword).toHaveBeenCalledWith(
        5,
        'adminAssignedPass',
      );
      expect(result).toEqual({ message: 'Password reset successfully' });
    });
  });
});
