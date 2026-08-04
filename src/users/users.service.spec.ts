import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';

import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto, UpdateAlluserinfoDto } from './dto/update-user.dto';

describe('UsersService', () => {
  let service: UsersService;

  beforeEach(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [UsersService],
    }).compile();

    service = moduleRef.get<UsersService>(UsersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return all users when no role is provided', () => {
      const result = service.findAll();
      expect(result).toHaveLength(4);
      expect(result[0].name).toBe('Alice');
    });

    const roleCases: Array<[
      string,
      'MANAGER' | 'STAFF' | 'ADMIN',
      number,
    ]> = [
      [
        'ADMIN role',
        'ADMIN',
        1,
      ],
      [
        'MANAGER role',
        'MANAGER',
        1,
      ],
      [
        'STAFF role',
        'STAFF',
        2,
      ],
    ];

    it.each(roleCases)(
      'should filter users correctly when given %s',
      (
        caseName: string,
        role: 'MANAGER' | 'STAFF' | 'ADMIN',
        expectedCount: number,
      ) => {
        const result = service.findAll(role);
        expect(result).toHaveLength(expectedCount);
        expect(result.every((u) => u.role === role)).toBe(true);
      },
    );

    it('should throw NotFoundException when no users match the given role', () => {
      const mockUsersService = service as any;
      mockUsersService.users = [];

      expect(() => service.findAll('ADMIN')).toThrow(NotFoundException);
      expect(() => service.findAll('ADMIN')).toThrow('User Role not Found');
    });
  });

  describe('findOne', () => {
    it('should return a user when valid id is given', () => {
      const user = service.findOne(1);
      expect(user).toBeDefined();
      expect(user?.id).toBe(1);
      expect(user?.name).toBe('Alice');
    });

    it('should return undefined when non-existent id is given', () => {
      const user = service.findOne(999);
      expect(user).toBeUndefined();
    });
  });

  describe('create', () => {
    it('should create and append a new user with auto-incremented id', () => {
      const dto: CreateUserDto = {
        name: 'Eve',
        email: 'eve@example.com',
        role: 'STAFF',
        password: 'password5',
        jobTitle: 'Developer',
      };

      const created = service.create(dto);
      expect(created.id).toBe(5);
      expect(created.name).toBe('Eve');

      const found = service.findOne(5);
      expect(found).toEqual(created);
    });
  });

  describe('update', () => {
    it('should update partial fields of an existing user', () => {
      const updateDto: UpdateUserDto = {
        name: 'Alice Updated',
      };

      const updated = service.update(1, updateDto);
      expect(updated?.name).toBe('Alice Updated');
      expect(updated?.email).toBe('alice@example.com');
    });

    it('should return undefined if updating non-existent user', () => {
      const updated = service.update(999, { name: 'Nobody' });
      expect(updated).toBeUndefined();
    });
  });

  describe('replace', () => {
    it('should replace user info completely', () => {
      const replaceDto: UpdateAlluserinfoDto = {
        name: 'Replaced Bob',
        email: 'bob.new@example.com',
        role: 'MANAGER',
        password: 'newpassword',
        jobTitle: 'Senior Manager',
      };

      const replaced = service.replace(2, replaceDto);
      expect(replaced?.name).toBe('Replaced Bob');
      expect(replaced?.email).toBe('bob.new@example.com');
    });
  });

  describe('delete', () => {
    it('should remove user and return the removed user', () => {
      const deleted = service.delete(3);
      expect(deleted?.id).toBe(3);

      const found = service.findOne(3);
      expect(found).toBeUndefined();
    });

    it('should return undefined when deleting non-existent user', () => {
      const deleted = service.delete(999);
      expect(deleted).toBeUndefined();
    });
  });
});
