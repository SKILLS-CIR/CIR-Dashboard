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
  private async resolveBookedById(
    requesterId: number,
    bookForUserId?: number,
  ): Promise<number> {
    const requester = await prisma.employee.findUnique({
      where: { id: requesterId },
      select: {
        role: true,
        subDepartmentId: true,
      },
    });

    if (!requester) {
      throw new ForbiddenException();
    }

    // STAFF → only self
    if (requester.role === Role.STAFF) {
      if (bookForUserId && bookForUserId !== requesterId) {
        throw new ForbiddenException('Staff cannot book classrooms for others');
      }
      return requesterId;
    }

    // ADMIN → anyone
    if (requester.role === Role.ADMIN) {
      return bookForUserId ?? requesterId;
    }

    // MANAGER → staff under them
    if (requester.role === Role.MANAGER) {
      if (!bookForUserId) {
        return requesterId;
      }

      const target = await prisma.employee.findUnique({
        where: { id: bookForUserId },
        select: {
          role: true,
          subDepartmentId: true,
        },
      });

      if (!target) {
        throw new BadRequestException('Target user not found');
      }

      if (target.role !== Role.STAFF) {
        throw new ForbiddenException('Manager can book only for staff');
      }

      if (target.subDepartmentId !== requester.subDepartmentId) {
        throw new ForbiddenException(
          'Manager can book only for staff under them',
        );
      }

      return bookForUserId;
    }

    throw new ForbiddenException();
  }

  // =========================
  // CREATE BOOKING
  // =========================
  async create(dto: any, requesterId: number) {
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
      where: { id: dto.classroomId, isActive: true },
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

    const bookedById = await this.resolveBookedById(
      requesterId,
      dto.bookForUserId,
    );

    return prisma.classroomBooking.create({
      data: {
        title: dto.title,
        description: dto.description,
        classroomId: dto.classroomId,
        bookedById,
        bookingDate,
        startTime,
        endTime,
      },
    });
  }

  // =========================
  // FIND BOOKINGS BY DATE
  // =========================
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

  // =========================
  // CANCEL BOOKING
  // =========================
  async cancel(bookingId: number, requesterId: number) {
    const booking = await prisma.classroomBooking.findUnique({
      where: { id: bookingId },
      include: {
        bookedBy: {
          select: {
            id: true,
            subDepartmentId: true,
          },
        },
      },
    });

    if (!booking) {
      throw new BadRequestException('Booking not found');
    }

    if (booking.isCancelled) {
      throw new BadRequestException('Booking already cancelled');
    }

    const requester = await prisma.employee.findUnique({
      where: { id: requesterId },
      select: {
        role: true,
        subDepartmentId: true,
      },
    });

    if (!requester) {
      throw new ForbiddenException();
    }

    const isOwner = booking.bookedById === requesterId;

    if (requester.role === Role.ADMIN) {
      // allowed
    } else if (requester.role === Role.MANAGER) {
      if (booking.bookedBy.subDepartmentId !== requester.subDepartmentId) {
        throw new ForbiddenException(
          'Manager can cancel only bookings under them',
        );
      }
    } else if (!isOwner) {
      throw new ForbiddenException('You cannot cancel this booking');
    }

    return prisma.classroomBooking.update({
      where: { id: bookingId },
      data: {
        isCancelled: true,
        cancelledAt: new Date(),
        cancelledById: requesterId,
      },
    });
  }
}
