-- CreateTable
CREATE TABLE "Classroom" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Classroom_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClassroomBooking" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "bookingDate" DATE NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3) NOT NULL,
    "isCancelled" BOOLEAN NOT NULL DEFAULT false,
    "cancelledAt" TIMESTAMP(3),
    "cancelledById" INTEGER,
    "isRecurring" BOOLEAN NOT NULL DEFAULT false,
    "recurrenceRule" TEXT,
    "recurrenceEnd" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "classroomId" INTEGER NOT NULL,
    "bookedById" INTEGER NOT NULL,
    "parentBookingId" INTEGER,

    CONSTRAINT "ClassroomBooking_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Classroom_isActive_idx" ON "Classroom"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "Classroom_name_key" ON "Classroom"("name");

-- CreateIndex
CREATE INDEX "ClassroomBooking_classroomId_bookingDate_idx" ON "ClassroomBooking"("classroomId", "bookingDate");

-- CreateIndex
CREATE INDEX "ClassroomBooking_bookedById_idx" ON "ClassroomBooking"("bookedById");

-- CreateIndex
CREATE INDEX "ClassroomBooking_isCancelled_idx" ON "ClassroomBooking"("isCancelled");

-- CreateIndex
CREATE INDEX "ClassroomBooking_parentBookingId_idx" ON "ClassroomBooking"("parentBookingId");

-- AddForeignKey
ALTER TABLE "ClassroomBooking" ADD CONSTRAINT "ClassroomBooking_cancelledById_fkey" FOREIGN KEY ("cancelledById") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClassroomBooking" ADD CONSTRAINT "ClassroomBooking_classroomId_fkey" FOREIGN KEY ("classroomId") REFERENCES "Classroom"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClassroomBooking" ADD CONSTRAINT "ClassroomBooking_bookedById_fkey" FOREIGN KEY ("bookedById") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClassroomBooking" ADD CONSTRAINT "ClassroomBooking_parentBookingId_fkey" FOREIGN KEY ("parentBookingId") REFERENCES "ClassroomBooking"("id") ON DELETE CASCADE ON UPDATE CASCADE;
