-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('MALE', 'FEMALE');

-- AlterTable
ALTER TABLE "Employee" ADD COLUMN     "avatarUrl" TEXT,
ADD COLUMN     "gender" "Gender" NOT NULL DEFAULT 'MALE';
