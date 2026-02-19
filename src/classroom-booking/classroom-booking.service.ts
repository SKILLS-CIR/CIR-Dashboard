import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { PrismaClient, Role } from '@prisma/client';

const prisma = new PrismaClient();

@Injectable()
export class ClassroomBookingService {
  async create(dto: any, userId: number) {
    if (
      !dto.classroomId ||
      !dto.bookingDate ||
      !dto.startTime ||
      !dto.endTime
    ) {
      throw new BadRequestException('Missing required fields');
    }

    const bookingDate = new Date(dto.bookingDate);
    const startTime = new Date(dto.startTime);
    const endTime = new Date(dto.endTime);

    if (
      isNaN(bookingDate.getTime()) ||
      isNaN(startTime.getTime()) ||
      isNaN(endTime.getTime())
    ) {
      throw new BadRequestException('Invalid date or time format');
    }

    if (startTime >= endTime) {
      throw new BadRequestException('Invalid time range');
    }

    const classroom = await prisma.classroom.findFirst({
      where: {
        id: dto.classroomId,
        isActive: true,
      },
    });

    if (!classroom) {
      throw new BadRequestException('Classroom not found or inactive');
    }

    const conflict = await prisma.classroomBooking.findFirst({
      where: {
        classroomId: dto.classroomId,
        bookingDate,
        isCancelled: false,
        startTime: { lt: endTime },
        endTime: { gt: startTime },
      },
    });

    if (conflict) {
      throw new ConflictException('Classroom already booked');
    }

    return prisma.classroomBooking.create({
      data: {
        title: dto.title,
        description: dto.description,
        classroomId: dto.classroomId,
        bookedById: userId,
        bookingDate,
        startTime,
        endTime,
        isRecurring: dto.isRecurring ?? false,
        recurrenceRule: dto.recurrenceRule,
        recurrenceEnd: dto.recurrenceEnd
          ? new Date(dto.recurrenceEnd)
          : null,
      },
    });
  }

  async findByDate(classroomId: number, date: string) {
    const bookingDate = new Date(date);

    if (isNaN(bookingDate.getTime())) {
      throw new BadRequestException('Invalid date');
    }

    return prisma.classroomBooking.findMany({
      where: {
        classroomId,
        bookingDate,
        isCancelled: false,
      },
      orderBy: { startTime: 'asc' },
      include: {
        bookedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
  }

  async cancel(bookingId: number, userId: number) {
    const booking = await prisma.classroomBooking.findUnique({
      where: { id: bookingId },
    });

    if (!booking) {
      throw new BadRequestException('Booking not found');
    }

    if (booking.isCancelled) {
      throw new BadRequestException('Booking already cancelled');
    }

    const user = await prisma.employee.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    if (!user) {
      throw new ForbiddenException();
    }

    const isOwner = booking.bookedById === userId;
    const isManagerOrAdmin =
      user.role === Role.ADMIN || user.role === Role.MANAGER;

    if (!isOwner && !isManagerOrAdmin) {
      throw new ForbiddenException('Not allowed to cancel this booking');
    }

    return prisma.classroomBooking.update({
      where: { id: bookingId },
      data: {
        isCancelled: true,
        cancelledAt: new Date(),
        cancelledById: userId,
      },
    });
  }
}
