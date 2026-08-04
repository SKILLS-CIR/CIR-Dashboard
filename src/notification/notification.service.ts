import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { CreateNotificationDto, CreateBroadcastNoticeDto, NoticeTargetType } from './dto/create-notification.dto';
import { UpdateNotificationDto } from './dto/update-notification.dto';
import { NotificationGateway } from './notification.gateway';

const prisma = new PrismaClient();

@Injectable()
export class NotificationService {
  constructor(private gateway: NotificationGateway) {}

  // ==================== Existing System Notification (unchanged) ====================
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

  // ==================== Notice Board - Broadcast ====================

  async createBroadcast(dto: CreateBroadcastNoticeDto, createdById: number, creatorRole: string, creatorSubDeptId: number | null) {
    // Role enforcement: Manager can only target their own sub-department or individual staff within it
    if (creatorRole === 'MANAGER') {
      if (dto.targetType === NoticeTargetType.ALL || dto.targetType === NoticeTargetType.DEPARTMENT) {
        throw new ForbiddenException('Managers can only target their sub-department or individual staff.');
      }
      if (dto.targetType === NoticeTargetType.SUB_DEPARTMENT) {
        if (!creatorSubDeptId || dto.targetId !== creatorSubDeptId) {
          throw new ForbiddenException('Managers can only target their own sub-department.');
        }
      }
    }

    // Resolve target user IDs
    const targetUserIds = await this.resolveTargetUsers(dto);

    if (!targetUserIds || targetUserIds.length === 0) {
      return { count: 0, message: `No recipients found for target.` };
    }

    // Use a single createdAt timestamp for the whole broadcast so all copies
    // of the notice can be grouped/identified as one broadcast batch.
    const createdAt = new Date();

    // Create notifications for each target user (same createdAt)
    const notifications = await prisma.$transaction(
      targetUserIds.map((userId) =>
        prisma.notification.create({
          data: {
            userId,
            title: dto.title,
            message: dto.message,
            type: 'NOTICE',
            targetType: dto.targetType,
            targetId: dto.targetId || null,
            isPinned: dto.isPinned || false,
            createdById,
            createdAt,
          },
        }),
      ),
    );

    // Real-time push to each user
    for (const notif of notifications) {
      this.gateway.sendNotification(notif.userId, notif);
    }

    return { count: notifications.length, message: `Notice sent to ${notifications.length} recipients.` };
  }

  private async resolveTargetUsers(dto: CreateBroadcastNoticeDto): Promise<number[]> {
    switch (dto.targetType) {
      case NoticeTargetType.ALL: {
        const allEmployees = await prisma.employee.findMany({
          where: { isActive: true },
          select: { id: true },
        });
        return allEmployees.map((e) => e.id);
      }
      case NoticeTargetType.DEPARTMENT: {
        if (!dto.targetId) throw new ForbiddenException('targetId (departmentId) is required for DEPARTMENT targeting.');
        const deptEmployees = await prisma.employee.findMany({
          where: { departmentId: dto.targetId, isActive: true },
          select: { id: true },
        });
        return deptEmployees.map((e) => e.id);
      }
      case NoticeTargetType.SUB_DEPARTMENT: {
        if (!dto.targetId) throw new ForbiddenException('targetId (subDepartmentId) is required for SUB_DEPARTMENT targeting.');
        const subDeptEmployees = await prisma.employee.findMany({
          where: { subDepartmentId: dto.targetId, isActive: true },
          select: { id: true },
        });
        return subDeptEmployees.map((e) => e.id);
      }
      case NoticeTargetType.INDIVIDUAL: {
        if (!dto.userIds || dto.userIds.length === 0) throw new ForbiddenException('userIds is required for INDIVIDUAL targeting.');
        return dto.userIds;
      }
      default:
        throw new ForbiddenException('Invalid targetType.');
    }
  }

  // ==================== Notice Board - Management ====================

  /**
   * Get notices created by the current user (for manage view)
   * Admin sees all notices, Manager sees their own
   */
  async getManageNotices(userId: number, role: string, departmentId?: number | null, subDepartmentId?: number | null) {
    // Admin sees all notices
    if (role === 'ADMIN') {
      const notices = await prisma.notification.findMany({
        where: { type: 'NOTICE' },
        orderBy: { createdAt: 'desc' },
        distinct: ['title', 'createdAt', 'createdById'],
        include: {
          createdBy: {
            select: { id: true, name: true, email: true, role: true },
          },
        },
      });

      // Group and return
      const grouped = new Map<string, any>();
      for (const n of notices) {
        const key = `${n.title}-${n.createdById}-${n.createdAt.toISOString()}`;
        if (!grouped.has(key)) {
          grouped.set(key, {
            id: n.id,
            title: n.title,
            message: n.message,
            targetType: n.targetType,
            targetId: n.targetId,
            isPinned: n.isPinned,
            createdById: n.createdById,
            createdBy: n.createdBy,
            createdAt: n.createdAt,
            type: n.type,
            recipientCount: 0,
          });
        }
        grouped.get(key).recipientCount++;
      }

      return Array.from(grouped.values());
    }

    // Managers should see notices they created, and broadcasts targeted to them
    const managerConditions: any[] = [{ createdById: userId }];

    // Notices targeted to everyone
    managerConditions.push({ targetType: 'ALL' });

    // Notices targeted to manager's department
    if (departmentId) managerConditions.push({ targetType: 'DEPARTMENT', targetId: departmentId });

    // Notices targeted to manager's sub-department
    if (subDepartmentId) managerConditions.push({ targetType: 'SUB_DEPARTMENT', targetId: subDepartmentId });

    // Notices individually addressed to this manager (recipient rows have userId set)
    managerConditions.push({ userId });

    const notices = await prisma.notification.findMany({
      where: {
        type: 'NOTICE',
        OR: managerConditions,
      },
      orderBy: { createdAt: 'desc' },
      distinct: ['title', 'createdAt', 'createdById'],
      include: {
        createdBy: {
          select: { id: true, name: true, email: true, role: true },
        },
      },
    });

    // Group by unique broadcast (same title + createdAt + createdById)
    const grouped = new Map<string, any>();
    for (const n of notices) {
      const key = `${n.title}-${n.createdById}-${n.createdAt.toISOString()}`;
      if (!grouped.has(key)) {
        grouped.set(key, {
          id: n.id,
          title: n.title,
          message: n.message,
          targetType: n.targetType,
          targetId: n.targetId,
          isPinned: n.isPinned,
          createdById: n.createdById,
          createdBy: n.createdBy,
          createdAt: n.createdAt,
          type: n.type,
          recipientCount: 0,
        });
      }
      grouped.get(key).recipientCount++;
    }

    return Array.from(grouped.values());
  }

  /**
   * Toggle pin status for a notice (all copies with same title+createdById+createdAt)
   */
  async togglePin(id: number, userId: number, role: string) {
    const notice = await prisma.notification.findUnique({ where: { id } });
    if (!notice) throw new NotFoundException('Notice not found.');

    if (role !== 'ADMIN' && notice.createdById !== userId) {
      throw new ForbiddenException('You can only pin/unpin your own notices.');
    }

    // Toggle for all recipients of this notice batch
    await prisma.notification.updateMany({
      where: {
        title: notice.title,
        createdById: notice.createdById,
        createdAt: notice.createdAt,
      },
      data: { isPinned: !notice.isPinned },
    });

    return { isPinned: !notice.isPinned };
  }

  /**
   * Update a notice (all copies with same title+createdById+createdAt)
   */
  async updateNotice(id: number, dto: UpdateNotificationDto, userId: number, role: string) {
    const notice = await prisma.notification.findUnique({ where: { id } });
    if (!notice) throw new NotFoundException('Notice not found.');

    if (role !== 'ADMIN' && notice.createdById !== userId) {
      throw new ForbiddenException('You can only update your own notices.');
    }

    await prisma.notification.updateMany({
      where: {
        title: notice.title,
        createdById: notice.createdById,
        createdAt: notice.createdAt,
      },
      data: {
        ...(dto.title ? { title: dto.title } : {}),
        ...(dto.message ? { message: dto.message } : {}),
        ...(dto.isPinned !== undefined ? { isPinned: dto.isPinned } : {}),
      },
    });

    return { message: 'Notice updated successfully.' };
  }

  /**
   * Delete a notice (all copies with same title+createdById+createdAt)
   */
  async deleteNotice(id: number, userId: number, role: string) {
    const notice = await prisma.notification.findUnique({ where: { id } });
    if (!notice) throw new NotFoundException('Notice not found.');

    if (role !== 'ADMIN' && notice.createdById !== userId) {
      throw new ForbiddenException('You can only delete your own notices.');
    }

    await prisma.notification.deleteMany({
      where: {
        title: notice.title,
        createdById: notice.createdById,
        createdAt: notice.createdAt,
      },
    });

    return { message: 'Notice deleted successfully.' };
  }

  // ==================== Notice Board - Targets ====================

  /**
   * Get available targeting options based on role
   */
  async getTargets(role: string, subDepartmentId: number | null) {
    const result: any = { departments: [], subDepartments: [], staff: [] };

    if (role === 'ADMIN') {
      result.departments = await prisma.department.findMany({
        where: { isActive: true },
        select: { id: true, name: true, type: true },
        orderBy: { name: 'asc' },
      });
      result.subDepartments = await prisma.subDepartment.findMany({
        where: { isActive: true },
        select: { id: true, name: true, departmentId: true, department: { select: { name: true } } },
        orderBy: { name: 'asc' },
      });
      result.staff = await prisma.employee.findMany({
        where: { isActive: true },
        select: { id: true, name: true, email: true, role: true, subDepartmentId: true },
        orderBy: { name: 'asc' },
      });
    } else if (role === 'MANAGER' && subDepartmentId) {
      result.subDepartments = await prisma.subDepartment.findMany({
        where: { id: subDepartmentId, isActive: true },
        select: { id: true, name: true, departmentId: true, department: { select: { name: true } } },
      });
      result.staff = await prisma.employee.findMany({
        where: { subDepartmentId, isActive: true },
        select: { id: true, name: true, email: true, role: true, subDepartmentId: true },
        orderBy: { name: 'asc' },
      });
    }

    return result;
  }

  // ==================== Staff Notice Board ====================

  /**
   * Get notice board items for staff (notices targeted to them)
   */
  async getNoticeBoard(userId: number) {
    return prisma.notification.findMany({
      where: {
        userId,
        type: 'NOTICE',
      },
      orderBy: [{ isPinned: 'desc' }, { createdAt: 'desc' }],
      include: {
        createdBy: {
          select: { id: true, name: true, role: true },
        },
      },
    });
  }
}
