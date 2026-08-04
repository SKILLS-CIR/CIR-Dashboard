import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { NotFoundException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';

jest.mock('bcryptjs');

import { AuthService } from './auth.service';
import { DatabaseService } from '../database/database.service';

describe('AuthService', () => {
  let service: AuthService;
  let databaseService: typeof mockDatabaseService;
  let jwtService: typeof mockJwtService;

  const mockDatabaseService = {
    employee: {
      findUnique: jest.fn(),
    },
  };

  const mockJwtService = {
    sign: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: DatabaseService,
          useValue: mockDatabaseService,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
      ],
    }).compile();

    service = moduleRef.get<AuthService>(AuthService);
    databaseService = moduleRef.get(DatabaseService);
    jwtService = moduleRef.get(JwtService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('login', () => {
    it('should throw NotFoundException when no user is found with email', async () => {
      databaseService.employee.findUnique.mockResolvedValue(null);

      await expect(
        service.login('nonexistent@example.com', 'password123'),
      ).rejects.toThrow(NotFoundException);

      await expect(
        service.login('nonexistent@example.com', 'password123'),
      ).rejects.toThrow('No user found for email: nonexistent@example.com');
    });

    it('should throw UnauthorizedException when password comparison fails', async () => {
      const mockUser = {
        id: 1,
        email: 'user@example.com',
        password: '$2a$10$hashedpassword',
        role: 'STAFF',
      };
      databaseService.employee.findUnique.mockResolvedValue(mockUser);
      jest.spyOn(bcrypt, 'compare').mockImplementation(async () => false);

      await expect(
        service.login('user@example.com', 'wrongpassword'),
      ).rejects.toThrow(UnauthorizedException);

      await expect(
        service.login('user@example.com', 'wrongpassword'),
      ).rejects.toThrow('Invalid password');
    });

    it('should return accessToken when valid credentials are provided', async () => {
      const mockUser = {
        id: 1,
        email: 'user@example.com',
        password: '$2a$10$hashedpassword',
        role: 'STAFF',
        departmentId: 2,
        subDepartmentId: 3,
      };
      databaseService.employee.findUnique.mockResolvedValue(mockUser);
      jest.spyOn(bcrypt, 'compare').mockImplementation(async () => true);
      jwtService.sign.mockReturnValue('mock-jwt-token');

      const result = await service.login('user@example.com', 'correctpassword');

      expect(databaseService.employee.findUnique).toHaveBeenCalledWith({
        where: { email: 'user@example.com' },
      });
      expect(jwtService.sign).toHaveBeenCalledWith({
        userId: 1,
        role: 'STAFF',
        departmentId: 2,
        subDepartmentId: 3,
      });
      expect(result).toEqual({ accessToken: 'mock-jwt-token' });
    });
  });
});
