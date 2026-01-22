-- CreateEnum
CREATE TYPE "SubmissionStatus" AS ENUM ('SUBMITTED', 'VERIFIED', 'REJECTED');

-- AlterTable
ALTER TABLE "WorkSubmission" ADD COLUMN     "rejectionReason" TEXT,
ADD COLUMN     "status" "SubmissionStatus" NOT NULL DEFAULT 'SUBMITTED';
