import { Notification as PrismaNotification } from '@prisma/client';

export class Notification implements PrismaNotification {
  id: number;
  userId: number;

  title: string;
  message: string;
  type: string;

  targetType: string | null;
  targetId: number | null;
  isPinned: boolean;
  createdById: number | null;

  entityId: number | null;
  entityType: string | null;

  isRead: boolean;

  createdAt: Date;
}

