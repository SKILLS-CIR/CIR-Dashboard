/*
  Warnings:

  - A unique constraint covering the columns `[assignmentId,workDate]` on the table `WorkSubmission` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "WorkSubmission_assignmentId_key";

-- CreateIndex
CREATE UNIQUE INDEX "WorkSubmission_assignmentId_workDate_key" ON "WorkSubmission"("assignmentId", "workDate");
