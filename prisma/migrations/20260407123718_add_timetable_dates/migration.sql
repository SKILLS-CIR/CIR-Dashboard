/*
  Warnings:

  - Added the required column `semesterEndDate` to the `Timetable` table without a default value. This is not possible if the table is not empty.
  - Added the required column `semesterStartDate` to the `Timetable` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Timetable" ADD COLUMN     "semesterEndDate" DATE NOT NULL,
ADD COLUMN     "semesterStartDate" DATE NOT NULL;
