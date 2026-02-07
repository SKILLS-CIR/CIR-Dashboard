-- CreateTable
CREATE TABLE "ResponsibilityGroup" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "cycle" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdById" INTEGER NOT NULL,
    "subDepartmentId" INTEGER NOT NULL,

    CONSTRAINT "ResponsibilityGroup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ResponsibilityGroupItem" (
    "id" SERIAL NOT NULL,
    "addedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "groupId" INTEGER NOT NULL,
    "responsibilityId" INTEGER NOT NULL,

    CONSTRAINT "ResponsibilityGroupItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ResponsibilityGroupAssignment" (
    "id" SERIAL NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "groupId" INTEGER NOT NULL,
    "staffId" INTEGER NOT NULL,
    "assignedById" INTEGER NOT NULL,

    CONSTRAINT "ResponsibilityGroupAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ResponsibilityGroup_subDepartmentId_idx" ON "ResponsibilityGroup"("subDepartmentId");

-- CreateIndex
CREATE INDEX "ResponsibilityGroup_createdById_idx" ON "ResponsibilityGroup"("createdById");

-- CreateIndex
CREATE INDEX "ResponsibilityGroup_cycle_idx" ON "ResponsibilityGroup"("cycle");

-- CreateIndex
CREATE INDEX "ResponsibilityGroup_isActive_idx" ON "ResponsibilityGroup"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "ResponsibilityGroup_subDepartmentId_name_key" ON "ResponsibilityGroup"("subDepartmentId", "name");

-- CreateIndex
CREATE INDEX "ResponsibilityGroupItem_groupId_idx" ON "ResponsibilityGroupItem"("groupId");

-- CreateIndex
CREATE INDEX "ResponsibilityGroupItem_responsibilityId_idx" ON "ResponsibilityGroupItem"("responsibilityId");

-- CreateIndex
CREATE UNIQUE INDEX "ResponsibilityGroupItem_groupId_responsibilityId_key" ON "ResponsibilityGroupItem"("groupId", "responsibilityId");

-- CreateIndex
CREATE INDEX "ResponsibilityGroupAssignment_groupId_idx" ON "ResponsibilityGroupAssignment"("groupId");

-- CreateIndex
CREATE INDEX "ResponsibilityGroupAssignment_staffId_idx" ON "ResponsibilityGroupAssignment"("staffId");

-- CreateIndex
CREATE INDEX "ResponsibilityGroupAssignment_assignedById_idx" ON "ResponsibilityGroupAssignment"("assignedById");

-- CreateIndex
CREATE UNIQUE INDEX "ResponsibilityGroupAssignment_groupId_staffId_key" ON "ResponsibilityGroupAssignment"("groupId", "staffId");

-- AddForeignKey
ALTER TABLE "ResponsibilityGroup" ADD CONSTRAINT "ResponsibilityGroup_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResponsibilityGroup" ADD CONSTRAINT "ResponsibilityGroup_subDepartmentId_fkey" FOREIGN KEY ("subDepartmentId") REFERENCES "SubDepartment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResponsibilityGroupItem" ADD CONSTRAINT "ResponsibilityGroupItem_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "ResponsibilityGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResponsibilityGroupItem" ADD CONSTRAINT "ResponsibilityGroupItem_responsibilityId_fkey" FOREIGN KEY ("responsibilityId") REFERENCES "Responsibility"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResponsibilityGroupAssignment" ADD CONSTRAINT "ResponsibilityGroupAssignment_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "ResponsibilityGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResponsibilityGroupAssignment" ADD CONSTRAINT "ResponsibilityGroupAssignment_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResponsibilityGroupAssignment" ADD CONSTRAINT "ResponsibilityGroupAssignment_assignedById_fkey" FOREIGN KEY ("assignedById") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;
