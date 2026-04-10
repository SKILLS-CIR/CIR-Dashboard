import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { UpdateNotificationDto } from './dto/update-notification.dto';
import { NotificationGateway } from './notification.gateway';

const prisma = new PrismaClient();

@Injectable()
export class NotificationService {
  constructor(private gateway: NotificationGateway) {}

  async create(dto: CreateNotificationDto) {
    const notification = await prisma.notification.create({
      data: dto,
    });

    // ⚡ REAL-TIME PUSH
    this.gateway.sendNotification(dto.userId, notification);

    return notification;
  }

  async findAll(userId: number) {
    return prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async markAsRead(id: number) {
    return prisma.notification.update({
      where: { id },
      data: { isRead: true },
    });
  }

  async markAllAsRead(userId: number) {
    return prisma.notification.updateMany({
      where: { userId },
      data: { isRead: true },
    });
  }

  async getUnreadCount(userId: number) {
    return prisma.notification.count({
      where: { userId, isRead: false },
    });
  }
}
