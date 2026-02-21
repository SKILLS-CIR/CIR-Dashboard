-- CreateEnum
CREATE TYPE "SemReportStatus" AS ENUM ('DRAFT', 'UNDER_MANAGER_REVIEW', 'UNDER_ADMIN_REVIEW', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "SemReportItemType" AS ENUM ('BATCH', 'RESPONSIBILITY');

-- CreateTable
CREATE TABLE "SemReport" (
    "id" SERIAL NOT NULL,
    "semesterStartDate" DATE NOT NULL,
    "semesterEndDate" DATE NOT NULL,
    "status" "SemReportStatus" NOT NULL DEFAULT 'DRAFT',
    "rejectionReason" TEXT,
    "managerReviewedAt" TIMESTAMP(3),
    "adminReviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "staffId" INTEGER NOT NULL,
    "managerReviewedById" INTEGER,
    "adminReviewedById" INTEGER,
    "rejectedById" INTEGER,

    CONSTRAINT "SemReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SemReportItem" (
    "id" SERIAL NOT NULL,
    "type" "SemReportItemType" NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "semReportId" INTEGER NOT NULL,

    CONSTRAINT "SemReportItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SemReportAttachment" (
    "id" SERIAL NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "fileType" TEXT,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "semReportItemId" INTEGER NOT NULL,

    CONSTRAINT "SemReportAttachment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SemReport_staffId_idx" ON "SemReport"("staffId");

-- CreateIndex
CREATE INDEX "SemReport_status_idx" ON "SemReport"("status");

-- CreateIndex
CREATE INDEX "SemReport_managerReviewedById_idx" ON "SemReport"("managerReviewedById");

-- CreateIndex
CREATE INDEX "SemReport_adminReviewedById_idx" ON "SemReport"("adminReviewedById");

-- CreateIndex
CREATE INDEX "SemReportItem_semReportId_idx" ON "SemReportItem"("semReportId");

-- CreateIndex
CREATE INDEX "SemReportItem_type_idx" ON "SemReportItem"("type");

-- CreateIndex
CREATE INDEX "SemReportAttachment_semReportItemId_idx" ON "SemReportAttachment"("semReportItemId");

-- AddForeignKey
ALTER TABLE "SemReport" ADD CONSTRAINT "SemReport_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SemReport" ADD CONSTRAINT "SemReport_managerReviewedById_fkey" FOREIGN KEY ("managerReviewedById") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SemReport" ADD CONSTRAINT "SemReport_adminReviewedById_fkey" FOREIGN KEY ("adminReviewedById") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SemReport" ADD CONSTRAINT "SemReport_rejectedById_fkey" FOREIGN KEY ("rejectedById") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SemReportItem" ADD CONSTRAINT "SemReportItem_semReportId_fkey" FOREIGN KEY ("semReportId") REFERENCES "SemReport"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SemReportAttachment" ADD CONSTRAINT "SemReportAttachment_semReportItemId_fkey" FOREIGN KEY ("semReportItemId") REFERENCES "SemReportItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;
