import { Test, TestingModule } from '@nestjs/testing';

import { ProfileService } from './profile.service';
import { DatabaseService } from '../database/database.service';

describe('ProfileService', () => {
  let service: ProfileService;
  let databaseService: typeof mockDatabaseService;

  const mockDatabaseService = {
    employee: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        ProfileService,
        {
          provide: DatabaseService,
          useValue: mockDatabaseService,
        },
      ],
    }).compile();

    service = moduleRef.get<ProfileService>(ProfileService);
    databaseService = moduleRef.get(DatabaseService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getProfile', () => {
    it('should return employee profile by user id', async () => {
      const mockUser = {
        id: 10,
        name: 'John',
        email: 'john@example.com',
        role: 'STAFF',
      };
      mockDatabaseService.employee.findUnique.mockResolvedValue(mockUser);

      const result = await service.getProfile(10);

      expect(databaseService.employee.findUnique).toHaveBeenCalledWith({
        where: { id: 10 },
        select: expect.any(Object),
      });
      expect(result).toEqual(mockUser);
    });
  });

  describe('updateAvatar', () => {
    it('should update avatarUrl without changing gender when gender is omitted', async () => {
      const dto = { avatarUrl: '/uploads/avatar1.png' };
      const mockResult = { id: 10, avatarUrl: '/uploads/avatar1.png', gender: 'MALE' };
      mockDatabaseService.employee.update.mockResolvedValue(mockResult);

      const result = await service.updateAvatar(10, dto as any);

      expect(databaseService.employee.update).toHaveBeenCalledWith({
        where: { id: 10 },
        data: { avatarUrl: '/uploads/avatar1.png' },
        select: expect.any(Object),
      });
      expect(result).toEqual(mockResult);
    });

    it('should convert gender to uppercase when gender is provided', async () => {
      const dto = { avatarUrl: '/uploads/avatar2.png', gender: 'female' as any };
      const mockResult = { id: 10, avatarUrl: '/uploads/avatar2.png', gender: 'FEMALE' };
      mockDatabaseService.employee.update.mockResolvedValue(mockResult);

      const result = await service.updateAvatar(10, dto);

      expect(databaseService.employee.update).toHaveBeenCalledWith({
        where: { id: 10 },
        data: { avatarUrl: '/uploads/avatar2.png', gender: 'FEMALE' },
        select: expect.any(Object),
      });
      expect(result).toEqual(mockResult);
    });
  });
});
