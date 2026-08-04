import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException, NotFoundException } from '@nestjs/common';

const mockPrisma = {
  notification: {
    create: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    updateMany: jest.fn(),
    deleteMany: jest.fn(),
    count: jest.fn(),
  },
  employee: {
    findMany: jest.fn(),
  },
  $transaction: jest.fn(),
};

jest.mock('@prisma/client', () => {
  const original = jest.requireActual('@prisma/client');
  return {
    ...original,
    PrismaClient: jest.fn().mockImplementation(() => mockPrisma),
  };
});

import { NotificationService } from './notification.service';
import { NotificationGateway } from './notification.gateway';
import { NoticeTargetType } from './dto/create-notification.dto';

describe('NotificationService', () => {
  let service: NotificationService;
  let gateway: NotificationGateway;

  const mockGateway = {
    sendNotification: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationService,
        {
          provide: NotificationGateway,
          useValue: mockGateway,
        },
      ],
    }).compile();

    service = moduleRef.get<NotificationService>(NotificationService);
    gateway = moduleRef.get<NotificationGateway>(NotificationGateway);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create notification in database and trigger real-time push via gateway', async () => {
      const dto: any = { userId: 10, title: 'Alert', message: 'Test' };
      const mockCreated = { id: 1, ...dto };

      mockPrisma.notification.create.mockResolvedValue(mockCreated as any);

      const result = await service.create(dto);

      expect(mockPrisma.notification.create).toHaveBeenCalledWith({ data: dto });
      expect(gateway.sendNotification).toHaveBeenCalledWith(10, mockCreated);
      expect(result).toEqual(mockCreated);
    });
  });

  describe('findAll', () => {
    it('should return user notifications ordered by createdAt desc', async () => {
      const mockNotifs = [{ id: 1, userId: 10 }];
      mockPrisma.notification.findMany.mockResolvedValue(mockNotifs as any);

      const result = await service.findAll(10);

      expect(mockPrisma.notification.findMany).toHaveBeenCalledWith({
        where: { userId: 10 },
        orderBy: { createdAt: 'desc' },
      });
      expect(result).toEqual(mockNotifs);
    });
  });

  describe('markAsRead', () => {
    it('should update isRead to true for specified notification id', async () => {
      mockPrisma.notification.update.mockResolvedValue({ id: 1, isRead: true } as any);

      const result = await service.markAsRead(1);

      expect(mockPrisma.notification.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { isRead: true },
      });
      expect(result.isRead).toBe(true);
    });
  });

  describe('markAllAsRead', () => {
    it('should update isRead to true for all notifications of specified userId', async () => {
      mockPrisma.notification.updateMany.mockResolvedValue({ count: 5 } as any);

      const result = await service.markAllAsRead(10);

      expect(mockPrisma.notification.updateMany).toHaveBeenCalledWith({
        where: { userId: 10 },
        data: { isRead: true },
      });
      expect(result).toEqual({ count: 5 });
    });
  });

  describe('getUnreadCount', () => {
    it('should return unread notifications count for user', async () => {
      mockPrisma.notification.count.mockResolvedValue(3 as any);

      const result = await service.getUnreadCount(10);

      expect(mockPrisma.notification.count).toHaveBeenCalledWith({
        where: { userId: 10, isRead: false },
      });
      expect(result).toBe(3);
    });
  });

  describe('createBroadcast', () => {
    const managerForbiddenCases: Array<[string, NoticeTargetType, number | null]> = [
      ['targeting ALL', NoticeTargetType.ALL, null],
      ['targeting DEPARTMENT', NoticeTargetType.DEPARTMENT, 1],
      ['targeting another SUB_DEPARTMENT', NoticeTargetType.SUB_DEPARTMENT, 99],
    ];

    it.each(managerForbiddenCases)(
      'should throw ForbiddenException when MANAGER attempts broadcast %s',
      async (
        caseName: string,
        targetType: NoticeTargetType,
        targetId: number | null,
      ) => {
        const dto: any = {
          title: 'Notice',
          message: 'Msg',
          targetType,
          targetId,
        };

        await expect(
          service.createBroadcast(dto, 2, 'MANAGER', 5),
        ).rejects.toThrow(ForbiddenException);
      },
    );

    it('should return count 0 message when no recipients are resolved', async () => {
      const dto: any = {
        title: 'Notice',
        message: 'Msg',
        targetType: NoticeTargetType.ALL,
      };

      mockPrisma.employee.findMany.mockResolvedValue([]);

      const result = await service.createBroadcast(dto, 1, 'ADMIN', null);

      expect(result).toEqual({
        count: 0,
        message: 'No recipients found for target.',
      });
    });

    it('should create notifications via transaction and push real-time updates', async () => {
      const dto: any = {
        title: 'Important Notice',
        message: 'Broadcasting to all',
        targetType: NoticeTargetType.ALL,
      };

      mockPrisma.employee.findMany.mockResolvedValue([{ id: 10 }, { id: 20 }] as any);

      const mockCreatedNotifs = [
        { id: 101, userId: 10, title: 'Important Notice' },
        { id: 102, userId: 20, title: 'Important Notice' },
      ];

      mockPrisma.$transaction.mockResolvedValue(mockCreatedNotifs as any);

      const result = await service.createBroadcast(dto, 1, 'ADMIN', null);

      expect(gateway.sendNotification).toHaveBeenCalledTimes(2);
      expect(result).toEqual({
        count: 2,
        message: 'Notice sent to 2 recipients.',
      });
    });
  });

  describe('togglePin', () => {
    it('should throw NotFoundException if notice is not found', async () => {
      mockPrisma.notification.findUnique.mockResolvedValue(null);

      await expect(service.togglePin(1, 10, 'ADMIN')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ForbiddenException if non-admin tries to toggle pin of another user', async () => {
      mockPrisma.notification.findUnique.mockResolvedValue({ id: 1, createdById: 99, isPinned: false } as any);

      await expect(service.togglePin(1, 10, 'MANAGER')).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should update pin status for notice batch when authorized', async () => {
      const mockNotice = {
        id: 1,
        title: 'Notice A',
        createdById: 10,
        createdAt: new Date(),
        isPinned: false,
      };

      mockPrisma.notification.findUnique.mockResolvedValue(mockNotice as any);
      mockPrisma.notification.updateMany.mockResolvedValue({ count: 2 } as any);

      const result = await service.togglePin(1, 10, 'MANAGER');

      expect(mockPrisma.notification.updateMany).toHaveBeenCalledWith({
        where: {
          title: 'Notice A',
          createdById: 10,
          createdAt: mockNotice.createdAt,
        },
        data: { isPinned: true },
      });
      expect(result).toEqual({ isPinned: true });
    });
  });

  describe('deleteNotice', () => {
    it('should throw NotFoundException if notice does not exist', async () => {
      mockPrisma.notification.findUnique.mockResolvedValue(null);

      await expect(service.deleteNotice(1, 10, 'ADMIN')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should delete notice batch when authorized', async () => {
      const mockNotice = {
        id: 1,
        title: 'Notice A',
        createdById: 10,
        createdAt: new Date(),
      };

      mockPrisma.notification.findUnique.mockResolvedValue(mockNotice as any);
      mockPrisma.notification.deleteMany.mockResolvedValue({ count: 2 } as any);

      const result = await service.deleteNotice(1, 10, 'ADMIN');

      expect(mockPrisma.notification.deleteMany).toHaveBeenCalledWith({
        where: {
          title: 'Notice A',
          createdById: 10,
          createdAt: mockNotice.createdAt,
        },
      });
      expect(result).toEqual({ message: 'Notice deleted successfully.' });
    });
  });
});
