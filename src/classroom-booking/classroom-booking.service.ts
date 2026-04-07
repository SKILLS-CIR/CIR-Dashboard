import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { DatabaseService } from 'src/database/database.service';

@Injectable()
export class ClassroomBookingService {
  constructor(private readonly databaseService: DatabaseService) {}
  private parseWeeklyDays(rule: string): number[] {
    // Example: FREQ=WEEKLY;BYDAY=MO,WE
    const match = rule.match(/BYDAY=([A-Z,]+)/);
    if (!match) return [];

    const dayMap: Record<string, number> = {
      SU: 0,
      MO: 1,
      TU: 2,
      WE: 3,
      TH: 4,
      FR: 5,
      SA: 6,
    };

    return match[1].split(',').map((d) => dayMap[d]);
  }
  private async resolveBookedById(
    requesterId: number,
    bookForUserId?: number,
  ): Promise<number> {
    const requester = await this.databaseService.employee.findUnique({
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

      const target = await this.databaseService.employee.findUnique({
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

    const classroom = await this.databaseService.classroom.findFirst({
      where: { id: dto.classroomId, isActive: true },
    });

    if (!classroom) {
      throw new BadRequestException('Classroom not found or inactive');
    }

    const bookedById = await this.resolveBookedById(
      requesterId,
      dto.bookForUserId,
    );

    // ===== PARENT CONFLICT CHECK =====
    const conflict = await this.databaseService.classroomBooking.findFirst({
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

    // ===== CREATE PARENT BOOKING =====
    const parent = await this.databaseService.classroomBooking.create({
      data: {
        title: dto.title,
        description: dto.description,
        classroomId: dto.classroomId,
        bookedById,
        bookingDate,
        startTime,
        endTime,
        isRecurring: dto.isRecurring ?? false,
        recurrenceRule: dto.recurrenceRule,
        recurrenceEnd: dto.recurrenceEnd ? new Date(dto.recurrenceEnd) : null,
      },
    });

    // ===== NO RECURRENCE → DONE =====
    if (!dto.isRecurring || !dto.recurrenceRule || !dto.recurrenceEnd) {
      return parent;
    }

    // ===== GENERATE OCCURRENCES =====
    const days = this.parseWeeklyDays(dto.recurrenceRule);
    const recurrenceEnd = new Date(dto.recurrenceEnd);

    const occurrences: any[] = [];
    let cursor = new Date(bookingDate);

    while (cursor <= recurrenceEnd) {
      if (days.includes(cursor.getDay())) {
        // skip parent date
        if (cursor.toDateString() !== bookingDate.toDateString()) {
          const occStart = new Date(startTime);
          const occEnd = new Date(endTime);

          occStart.setFullYear(
            cursor.getFullYear(),
            cursor.getMonth(),
            cursor.getDate(),
          );
          occEnd.setFullYear(
            cursor.getFullYear(),
            cursor.getMonth(),
            cursor.getDate(),
          );

          const occConflict = await this.databaseService.classroomBooking.findFirst({
            where: {
              classroomId: dto.classroomId,
              bookingDate: cursor,
              isCancelled: false,
              startTime: { lt: occEnd },
              endTime: { gt: occStart },
            },
          });

          if (!occConflict) {
            occurrences.push({
              title: dto.title,
              description: dto.description,
              classroomId: dto.classroomId,
              bookedById,
              bookingDate: new Date(cursor),
              startTime: occStart,
              endTime: occEnd,
              parentBookingId: parent.id,
            });
          }
        }
      }
      cursor.setDate(cursor.getDate() + 1);
    }

    if (occurrences.length > 0) {
      await this.databaseService.classroomBooking.createMany({
        data: occurrences,
      });
    }

    return parent;
  }
  // =========================
  // FIND BOOKINGS BY DATE
  // =========================
  async findByDate(classroomId: number, date: string) {
    const bookingDate = new Date(date);

    if (isNaN(bookingDate.getTime())) {
      throw new BadRequestException('Invalid date');
    }

    // Set bounds for the entire day to avoid timezone mismatches
    const startOfDay = new Date(bookingDate);
    startOfDay.setUTCHours(0, 0, 0, 0);
    const endOfDay = new Date(bookingDate);
    endOfDay.setUTCHours(23, 59, 59, 999);

    return this.databaseService.classroomBooking.findMany({
      where: {
        classroomId,
        bookingDate: { gte: startOfDay, lte: endOfDay },
        isCancelled: false,
      },
      orderBy: { startTime: 'asc' },
      include: {
        classroom: {
          select: {
            id: true,
            name: true,
          },
        },
        bookedBy: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
    });
  }

  /**
   * Get all bookings across ALL classrooms for a specific date.
   */
  async findAllByDate(date: string) {
    const bookingDate = new Date(date);

    if (isNaN(bookingDate.getTime())) {
      throw new BadRequestException('Invalid date');
    }

    const startOfDay = new Date(bookingDate);
    startOfDay.setUTCHours(0, 0, 0, 0);
    const endOfDay = new Date(bookingDate);
    endOfDay.setUTCHours(23, 59, 59, 999);

    return this.databaseService.classroomBooking.findMany({
      where: {
        bookingDate: { gte: startOfDay, lte: endOfDay },
        isCancelled: false,
      },
      orderBy: [{ classroom: { name: 'asc' } }, { startTime: 'asc' }],
      include: {
        classroom: {
          select: {
            id: true,
            name: true,
          },
        },
        bookedBy: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
    });
  }

  /**
   * Get all bookings for a specific classroom across ALL dates.
   */
  async findAllByClassroom(classroomId: number) {
    return this.databaseService.classroomBooking.findMany({
      where: {
        classroomId,
        isCancelled: false,
      },
      orderBy: [{ bookingDate: 'asc' }, { startTime: 'asc' }],
      include: {
        classroom: {
          select: {
            id: true,
            name: true,
          },
        },
        bookedBy: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
    });
  }

  // =========================
  // CANCEL BOOKING
  // =========================
  async cancel(bookingId: number, userId: number) {
    const booking = await this.databaseService.classroomBooking.findUnique({
      where: { id: bookingId },
      select: {
        id: true,
        bookedById: true,
        isCancelled: true,
      },
    });

    if (!booking) {
      throw new BadRequestException('Booking not found');
    }

    if (booking.isCancelled) {
      throw new BadRequestException('Booking already cancelled');
    }

    const user = await this.databaseService.employee.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    if (!user) {
      throw new ForbiddenException();
    }

    const isOwner = booking.bookedById === userId;
    const isAdmin = user.role === Role.ADMIN;

    // DEBUG LOGS
    console.log('booking.bookedById:', booking.bookedById);
    console.log('current userId:', userId);
    console.log('isOwner:', isOwner);
    console.log('user.role:', user.role);
    console.log('isAdmin:', isAdmin);

    if (!isOwner && !isAdmin) {
      throw new ForbiddenException('You can only cancel your own booking');
    }

    return this.databaseService.classroomBooking.update({
      where: { id: bookingId },
      data: {
        isCancelled: true,
        cancelledAt: new Date(),
        cancelledById: userId,
      },
    });
  }
}
