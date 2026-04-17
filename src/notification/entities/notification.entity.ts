import { Notification as PrismaNotification } from '@prisma/client';

export class Notification implements PrismaNotification {
  id: number;
  userId: number;

  title: string;
  message: string;
  type: string;

  entityId: number | null;
  entityType: string | null;

  isRead: boolean;

  createdAt: Date;
}
