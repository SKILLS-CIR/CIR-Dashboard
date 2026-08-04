import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';

import { ProfileController } from './profile.controller';
import { ProfileService } from './profile.service';
import { UpdateAvatarDto } from './dto/update-avatar.dto';

describe('ProfileController', () => {
  let controller: ProfileController;
  let service: ProfileService;

  const mockProfileService = {
    getProfile: jest.fn(),
    updateAvatar: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const moduleRef: TestingModule = await Test.createTestingModule({
      controllers: [ProfileController],
      providers: [
        {
          provide: ProfileService,
          useValue: mockProfileService,
        },
      ],
    }).compile();

    controller = moduleRef.get<ProfileController>(ProfileController);
    service = moduleRef.get<ProfileService>(ProfileService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getProfile', () => {
    it('should call profileService.getProfile with user id', async () => {
      const req = { user: { id: 10 } };
      mockProfileService.getProfile.mockResolvedValue({ id: 10, name: 'John' });

      const result = await controller.getProfile(req);

      expect(service.getProfile).toHaveBeenCalledWith(10);
      expect(result).toEqual({ id: 10, name: 'John' });
    });
  });

  describe('updateAvatar', () => {
    it('should call profileService.updateAvatar with user id and dto', async () => {
      const req = { user: { id: 10 } };
      const dto: UpdateAvatarDto = { avatarUrl: '/uploads/avatar.png' };
      mockProfileService.updateAvatar.mockResolvedValue({ id: 10, avatarUrl: '/uploads/avatar.png' });

      const result = await controller.updateAvatar(req, dto);

      expect(service.updateAvatar).toHaveBeenCalledWith(10, dto);
      expect(result).toEqual({ id: 10, avatarUrl: '/uploads/avatar.png' });
    });
  });

  describe('uploadAvatar', () => {
    it('should throw BadRequestException if file is null/undefined', async () => {
      const req = { user: { id: 10 } };

      await expect(
        controller.uploadAvatar(req, null as any, 'male'),
      ).rejects.toThrow(BadRequestException);
      await expect(
        controller.uploadAvatar(req, null as any, 'male'),
      ).rejects.toThrow('No file uploaded');
    });

    it('should update avatar URL in database and return relative path when file is uploaded', async () => {
      const req = { user: { id: 10 } };
      const file: any = { filename: 'avatar-12345.png' };
      mockProfileService.updateAvatar.mockResolvedValue({ id: 10 });

      const result = await controller.uploadAvatar(req, file, 'female');

      expect(service.updateAvatar).toHaveBeenCalledWith(10, {
        avatarUrl: '/uploads/avatar-12345.png',
        gender: 'female',
      });
      expect(result).toEqual({
        avatarUrl: '/uploads/avatar-12345.png',
        message: 'Avatar uploaded successfully',
      });
    });
  });
});
