import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';

jest.mock('bcryptjs');

import { EmployeesService } from './employees.service';
import { DatabaseService } from '../database/database.service';

describe('EmployeesService', () => {
  let service: EmployeesService;
  let databaseService: typeof mockDatabaseService;

  const mockDatabaseService = {
    employee: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    notification: {
      deleteMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        EmployeesService,
        {
          provide: DatabaseService,
          useValue: mockDatabaseService,
        },
      ],
    }).compile();

    service = moduleRef.get<EmployeesService>(EmployeesService);
    databaseService = moduleRef.get(DatabaseService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should hash password and create employee', async () => {
      const dto: any = { name: 'John', password: 'plainPassword123' };
      jest.spyOn(bcrypt, 'hash').mockImplementation(async () => '$2a$10$hashed');
      mockDatabaseService.employee.create.mockResolvedValue({ id: 1, ...dto });

      const result = await service.create(dto);

      expect(bcrypt.hash).toHaveBeenCalledWith('plainPassword123', 10);
      expect(databaseService.employee.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ password: '$2a$10$hashed' }),
      });
      expect(result).toBeDefined();
    });
  });

  describe('findAll', () => {
    it('should filter by role if role argument is passed', async () => {
      mockDatabaseService.employee.findMany.mockResolvedValue([]);

      await service.findAll('MANAGER');

      expect(databaseService.employee.findMany).toHaveBeenCalledWith({
        where: { role: 'MANAGER' },
      });
    });

    it('should return all employees if no role argument is passed', async () => {
      mockDatabaseService.employee.findMany.mockResolvedValue([]);

      await service.findAll(undefined as any);

      expect(databaseService.employee.findMany).toHaveBeenCalledWith();
    });
  });

  describe('update', () => {
    it('should re-hash password if plain string password is provided in update DTO', async () => {
      const updateDto: any = { password: 'newSecretPassword' };
      jest.spyOn(bcrypt, 'hash').mockImplementation(async () => '$2a$10$newhashed');
      mockDatabaseService.employee.update.mockResolvedValue({ id: 1 });

      await service.update(1, updateDto);

      expect(bcrypt.hash).toHaveBeenCalledWith('newSecretPassword', 10);
      expect(databaseService.employee.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: expect.objectContaining({ password: '$2a$10$newhashed' }),
      });
    });

    it('should re-hash password if object with set property is provided', async () => {
      const updateDto: any = { password: { set: 'nestedPassword' } };
      jest.spyOn(bcrypt, 'hash').mockImplementation(async () => '$2a$10$newhashed');
      mockDatabaseService.employee.update.mockResolvedValue({ id: 1 });

      await service.update(1, updateDto);

      expect(bcrypt.hash).toHaveBeenCalledWith('nestedPassword', 10);
    });
  });

  describe('remove', () => {
    it('should throw NotFoundException if employee does not exist', async () => {
      mockDatabaseService.employee.findUnique.mockResolvedValue(null);

      await expect(service.remove(999)).rejects.toThrow(NotFoundException);
      await expect(service.remove(999)).rejects.toThrow(
        'Employee with ID 999 not found',
      );
    });

    it('should delete associated notifications and then delete employee', async () => {
      mockDatabaseService.employee.findUnique.mockResolvedValue({ id: 1 });
      mockDatabaseService.notification.deleteMany.mockResolvedValue({ count: 2 });
      mockDatabaseService.employee.delete.mockResolvedValue({ id: 1 });

      const result = await service.remove(1);

      expect(databaseService.notification.deleteMany).toHaveBeenCalledWith({
        where: { userId: 1 },
      });
      expect(databaseService.employee.delete).toHaveBeenCalledWith({
        where: { id: 1 },
      });
      expect(result).toEqual({ id: 1 });
    });
  });

  describe('changePassword', () => {
    it('should throw NotFoundException if user is not found', async () => {
      mockDatabaseService.employee.findUnique.mockResolvedValue(null);

      await expect(
        service.changePassword(999, 'curr', 'new'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw UnauthorizedException if current password is wrong', async () => {
      mockDatabaseService.employee.findUnique.mockResolvedValue({
        id: 1,
        password: '$2a$10$hash',
      });
      jest.spyOn(bcrypt, 'compare').mockImplementation(async () => false);

      await expect(
        service.changePassword(1, 'wrongPassword', 'newPassword123'),
      ).rejects.toThrow(UnauthorizedException);
      await expect(
        service.changePassword(1, 'wrongPassword', 'newPassword123'),
      ).rejects.toThrow('Current password is incorrect');
    });

    it('should update password when current password matches', async () => {
      mockDatabaseService.employee.findUnique.mockResolvedValue({
        id: 1,
        password: '$2a$10$hash',
      });
      jest.spyOn(bcrypt, 'compare').mockImplementation(async () => true);
      jest.spyOn(bcrypt, 'hash').mockImplementation(async () => '$2a$10$newhash');
      mockDatabaseService.employee.update.mockResolvedValue({ id: 1 });

      const result = await service.changePassword(1, 'correctPass', 'newPass123');

      expect(databaseService.employee.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { password: '$2a$10$newhash' },
      });
      expect(result).toEqual({ id: 1 });
    });
  });

  describe('resetPassword', () => {
    it('should throw NotFoundException if user is not found', async () => {
      mockDatabaseService.employee.findUnique.mockResolvedValue(null);

      await expect(service.resetPassword(999, 'newPass123')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw UnauthorizedException if new password is too short', async () => {
      mockDatabaseService.employee.findUnique.mockResolvedValue({ id: 1 });

      await expect(service.resetPassword(1, '12345')).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(service.resetPassword(1, '12345')).rejects.toThrow(
        'New password must be at least 6 characters',
      );
    });

    it('should hash and set new password on successful reset', async () => {
      mockDatabaseService.employee.findUnique.mockResolvedValue({ id: 1 });
      jest.spyOn(bcrypt, 'hash').mockImplementation(async () => '$2a$10$resethash');
      mockDatabaseService.employee.update.mockResolvedValue({ id: 1 });

      const result = await service.resetPassword(1, 'validPassword');

      expect(databaseService.employee.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { password: '$2a$10$resethash' },
      });
      expect(result).toEqual({ message: 'Password reset successfully' });
    });
  });

  describe('findAllScoped', () => {
    const roleCases: Array<[
      string,
      number,
      string,
      number | null,
      any,
    ]> = [
      [
        'STAFF user seeing only self',
        10,
        'STAFF',
        null,
        { id: 10 },
      ],
      [
        'MANAGER with subDepartmentId',
        20,
        'MANAGER',
        3,
        { subDepartmentId: 3 },
      ],
      [
        'ADMIN user seeing all',
        1,
        'ADMIN',
        null,
        {},
      ],
    ];

    it.each(roleCases)(
      'should construct correct where clause for %s',
      async (
        caseName: string,
        userId: number,
        userRole: string,
        userSubDeptId: number | null,
        expectedWhere: any,
      ) => {
        mockDatabaseService.employee.findMany.mockResolvedValue([]);

        await service.findAllScoped(userId, userRole, userSubDeptId);

        expect(databaseService.employee.findMany).toHaveBeenCalledWith(
          expect.objectContaining({
            where: expectedWhere,
          }),
        );
      },
    );

    it('should return empty array if MANAGER has null subDepartmentId', async () => {
      const result = await service.findAllScoped(20, 'MANAGER', null);
      expect(result).toEqual([]);
      expect(databaseService.employee.findMany).not.toHaveBeenCalled();
    });
  });
});
