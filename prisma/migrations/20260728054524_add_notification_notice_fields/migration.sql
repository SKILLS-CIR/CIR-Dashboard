-- AlterTable
ALTER TABLE "Notification" ADD COLUMN     "createdById" INTEGER,
ADD COLUMN     "isPinned" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "targetId" INTEGER,
ADD COLUMN     "targetType" TEXT,
ALTER COLUMN "type" SET DEFAULT 'NOTICE';

-- CreateIndex
CREATE INDEX "Notification_userId_idx" ON "Notification"("userId");

-- CreateIndex
CREATE INDEX "Notification_createdById_idx" ON "Notification"("createdById");

-- CreateIndex
CREATE INDEX "Notification_targetType_idx" ON "Notification"("targetType");

-- CreateIndex
CREATE INDEX "Notification_isPinned_idx" ON "Notification"("isPinned");

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;
