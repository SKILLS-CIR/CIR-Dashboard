import { Test, TestingModule } from '@nestjs/testing';

import { NotificationController } from './notification.controller';
import { NotificationService } from './notification.service';
import { CreateBroadcastNoticeDto, NoticeTargetType } from './dto/create-notification.dto';
import { UpdateNotificationDto } from './dto/update-notification.dto';

describe('NotificationController', () => {
  let controller: NotificationController;
  let service: NotificationService;

  const mockNotificationService = {
    findAll: jest.fn(),
    markAsRead: jest.fn(),
    markAllAsRead: jest.fn(),
    getUnreadCount: jest.fn(),
    createBroadcast: jest.fn(),
    getManageNotices: jest.fn(),
    togglePin: jest.fn(),
    updateNotice: jest.fn(),
    deleteNotice: jest.fn(),
    getTargets: jest.fn(),
    getNoticeBoard: jest.fn(),
    create: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const moduleRef: TestingModule = await Test.createTestingModule({
      controllers: [NotificationController],
      providers: [
        {
          provide: NotificationService,
          useValue: mockNotificationService,
        },
      ],
    }).compile();

    controller = moduleRef.get<NotificationController>(
      NotificationController,
    );
    service = moduleRef.get<NotificationService>(NotificationService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getMyNotifications', () => {
    it('should delegate to service.findAll with user id', async () => {
      const req = { user: { id: 10 } };
      mockNotificationService.findAll.mockResolvedValue([]);

      const result = await controller.getMyNotifications(req);

      expect(service.findAll).toHaveBeenCalledWith(10);
      expect(result).toEqual([]);
    });
  });

  describe('markAsRead', () => {
    it('should parse string id and call service.markAsRead', async () => {
      mockNotificationService.markAsRead.mockResolvedValue({ id: 1, isRead: true });

      const result = await controller.markAsRead('1');

      expect(service.markAsRead).toHaveBeenCalledWith(1);
      expect(result).toEqual({ id: 1, isRead: true });
    });
  });

  describe('markAll', () => {
    it('should call service.markAllAsRead with user id', async () => {
      const req = { user: { id: 10 } };
      mockNotificationService.markAllAsRead.mockResolvedValue({ count: 3 });

      const result = await controller.markAll(req);

      expect(service.markAllAsRead).toHaveBeenCalledWith(10);
      expect(result).toEqual({ count: 3 });
    });
  });

  describe('getUnread', () => {
    it('should call service.getUnreadCount with user id', async () => {
      const req = { user: { id: 10 } };
      mockNotificationService.getUnreadCount.mockResolvedValue(5);

      const result = await controller.getUnread(req);

      expect(service.getUnreadCount).toHaveBeenCalledWith(10);
      expect(result).toBe(5);
    });
  });

  describe('createBroadcast', () => {
    it('should pass dto and user context to service.createBroadcast', async () => {
      const dto: CreateBroadcastNoticeDto = {
        title: 'Title',
        message: 'Message',
        targetType: NoticeTargetType.ALL,
      };
      const req = {
        user: { id: 1, role: 'ADMIN', subDepartmentId: null },
      };
      mockNotificationService.createBroadcast.mockResolvedValue({ count: 5 });

      const result = await controller.createBroadcast(req, dto);

      expect(service.createBroadcast).toHaveBeenCalledWith(
        dto,
        1,
        'ADMIN',
        null,
      );
      expect(result).toEqual({ count: 5 });
    });
  });

  describe('getManageNotices', () => {
    it('should pass user context to service.getManageNotices', async () => {
      const req = {
        user: { id: 1, role: 'ADMIN', departmentId: 2, subDepartmentId: 3 },
      };
      mockNotificationService.getManageNotices.mockResolvedValue([]);

      const result = await controller.getManageNotices(req);

      expect(service.getManageNotices).toHaveBeenCalledWith(
        1,
        'ADMIN',
        2,
        3,
      );
      expect(result).toEqual([]);
    });
  });

  describe('togglePin', () => {
    it('should parse id and call service.togglePin with user id and role', async () => {
      const req = { user: { id: 10, role: 'MANAGER' } };
      mockNotificationService.togglePin.mockResolvedValue({ isPinned: true });

      const result = await controller.togglePin('1', req);

      expect(service.togglePin).toHaveBeenCalledWith(1, 10, 'MANAGER');
      expect(result).toEqual({ isPinned: true });
    });
  });

  describe('updateNotice', () => {
    it('should parse id and pass dto with user context to service.updateNotice', async () => {
      const dto: UpdateNotificationDto = { title: 'Updated Title' };
      const req = { user: { id: 10, role: 'MANAGER' } };
      mockNotificationService.updateNotice.mockResolvedValue({ message: 'OK' });

      const result = await controller.updateNotice('1', req, dto);

      expect(service.updateNotice).toHaveBeenCalledWith(1, dto, 10, 'MANAGER');
      expect(result).toEqual({ message: 'OK' });
    });
  });

  describe('deleteNotice', () => {
    it('should parse id and call service.deleteNotice with user id and role', async () => {
      const req = { user: { id: 10, role: 'MANAGER' } };
      mockNotificationService.deleteNotice.mockResolvedValue({ message: 'Deleted' });

      const result = await controller.deleteNotice('1', req);

      expect(service.deleteNotice).toHaveBeenCalledWith(1, 10, 'MANAGER');
      expect(result).toEqual({ message: 'Deleted' });
    });
  });

  describe('getTargets', () => {
    it('should pass user role and subDepartmentId to service.getTargets', async () => {
      const req = { user: { role: 'MANAGER', subDepartmentId: 5 } };
      mockNotificationService.getTargets.mockResolvedValue({});

      const result = await controller.getTargets(req);

      expect(service.getTargets).toHaveBeenCalledWith('MANAGER', 5);
      expect(result).toEqual({});
    });
  });

  describe('getNoticeBoard', () => {
    it('should call service.getNoticeBoard with user id', async () => {
      const req = { user: { id: 10 } };
      mockNotificationService.getNoticeBoard.mockResolvedValue([]);

      const result = await controller.getNoticeBoard(req);

      expect(service.getNoticeBoard).toHaveBeenCalledWith(10);
      expect(result).toEqual([]);
    });
  });

  describe('createTest', () => {
    it('should call service.create with test payload', async () => {
      const req = { user: { id: 10 } };
      mockNotificationService.create.mockResolvedValue({ id: 99 });

      const result = await controller.createTest(req);

      expect(service.create).toHaveBeenCalledWith({
        userId: 10,
        title: 'Test Notification',
        message: 'This is a test notification',
        type: 'TEST',
      });
      expect(result).toEqual({ id: 99 });
    });
  });
});
