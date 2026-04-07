import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { DatabaseService } from 'src/database/database.service';
import { CreateTimetableEntryDto } from './dto/create-timetable-entry.dto';
import { UpdateTimetableEntryDto } from './dto/update-timetable-entry.dto';

// Reference dates for each day-of-week (a known Monday–Saturday week)
const DAY_REFERENCE_DATES: Record<string, string> = {
  Monday: '2026-01-05',
  Tuesday: '2026-01-06',
  Wednesday: '2026-01-07',
  Thursday: '2026-01-08',
  Friday: '2026-01-09',
  Saturday: '2026-01-10',
};

const VALID_DAYS = Object.keys(DAY_REFERENCE_DATES);

@Injectable()
export class TimetableService {
  constructor(private readonly db: DatabaseService) {}

  // ─── Helpers ────────────────────────────────────────

  /** Validate time bounds: 09:00–16:50 (Based on IST +05:30) */
  private validateTimeBounds(startTime: Date, endTime: Date) {
    const getIstMins = (d: Date) => {
      let mins = d.getUTCHours() * 60 + d.getUTCMinutes() + 330;
      if (mins >= 24 * 60) mins -= 24 * 60;
      return mins;
    };

    const startMin = getIstMins(startTime);
    const endMin = getIstMins(endTime);

    if (startMin >= endMin) {
      throw new BadRequestException('Start time must be before end time');
    }
    if (startMin < 9 * 60) {
      throw new BadRequestException('Start time cannot be before 09:00');
    }
    if (endMin > 16 * 60 + 50) {
      throw new BadRequestException('End time cannot be after 16:50');
    }
  }

  /** Get user with role info */
  private async getUser(userId: number) {
    const user = await this.db.employee.findUnique({
      where: { id: userId },
      select: { id: true, role: true, subDepartmentId: true },
    });
    if (!user) throw new ForbiddenException('User not found');
    return user;
  }

  /** Check if user is the manager of the timetable's sub-department */
  private async assertManagerAccess(subDepartmentId: number, userId: number) {
    const user = await this.getUser(userId);
    if (user.role === Role.ADMIN) return user;

    if (user.role !== Role.MANAGER) {
      throw new ForbiddenException('Only managers and admins can perform this action');
    }

    const subDept = await this.db.subDepartment.findUnique({
      where: { id: subDepartmentId },
      select: { managerId: true },
    });

    const isManagerOfSubDept = subDept?.managerId === userId;
    const isInsideSubDept = user.subDepartmentId === subDepartmentId;

    if (!isManagerOfSubDept && !isInsideSubDept) {
      throw new ForbiddenException('You can only manage timetables for your own sub-department');
    }

    return user;
  }

  // ─── Conflict Checks ───────────────────────────────

  /**
   * Check for classroom conflicts against existing ClassroomBooking records.
   * Uses Prisma queries + JS filtering to avoid Postgres timezone issues.
   */
  private async checkClassroomBookingConflict(
    classroomId: number,
    day: string,
    startTime: Date,
    endTime: Date,
    semStart: Date,
    semEnd: Date,
    excludeEntryId?: number,
  ) {

    // Day-of-week map (JS getUTCDay(): Sunday=0, Monday=1, etc.)
    const dayMap: Record<string, number> = {
      Sunday: 0, Monday: 1, Tuesday: 2, Wednesday: 3,
      Thursday: 4, Friday: 5, Saturday: 6,
    };
    const targetDayIndex = dayMap[day];

    // Extract the time-of-day in minutes (UTC) for the new entry
    const newStartMin = startTime.getUTCHours() * 60 + startTime.getUTCMinutes();
    const newEndMin = endTime.getUTCHours() * 60 + endTime.getUTCMinutes();

    // Fetch all active MANUAL bookings for this classroom in the semester
    // Exclude auto-generated timetable bookings (those are handled by entry-level checks)
    const bookings = await this.db.classroomBooking.findMany({
      where: {
        classroomId,
        isCancelled: false,
        bookingDate: { gte: semStart, lte: semEnd },
        NOT: {
          description: { contains: 'Auto-created from timetable' },
        },
      },
      select: { id: true, bookingDate: true, startTime: true, endTime: true },
    });

    // Filter in JS: same day-of-week + overlapping time
    for (const booking of bookings) {
      const bookingDow = new Date(booking.bookingDate).getUTCDay();
      if (bookingDow !== targetDayIndex) continue;

      const bStartMin =
        new Date(booking.startTime).getUTCHours() * 60 +
        new Date(booking.startTime).getUTCMinutes();
      const bEndMin =
        new Date(booking.endTime).getUTCHours() * 60 +
        new Date(booking.endTime).getUTCMinutes();

      if (bStartMin < newEndMin && bEndMin > newStartMin) {
        throw new ConflictException(
          `Classroom is already manually booked for this timeslot on ${new Date(booking.bookingDate).toISOString().split('T')[0]}`,
        );
      }
    }
  }

  /**
   * Check for staff conflicts within the SAME timetable.
   * Cross-timetable staff conflicts are validated at publish time.
   */
  private async checkStaffConflict(
    timetableId: number,
    staffId: number,
    day: string,
    startTime: Date,
    endTime: Date,
    excludeEntryId?: number,
  ) {
    const where: any = {
      timetableId,
      staffId,
      day,
      startTime: { lt: endTime },
      endTime: { gt: startTime },
    };

    if (excludeEntryId) {
      where.id = { not: excludeEntryId };
    }

    const conflict = await this.db.timetableEntry.findFirst({ where });

    if (conflict) {
      throw new ConflictException('Staff already assigned for this timeslot on ' + day);
    }
  }

  /**
   * Check for classroom conflicts within the SAME timetable.
   * Cross-timetable classroom conflicts are validated at publish time.
   */
  private async checkClassroomEntryConflict(
    timetableId: number,
    classroomId: number,
    day: string,
    startTime: Date,
    endTime: Date,
    excludeEntryId?: number,
  ) {
    const where: any = {
      timetableId,
      classroomId,
      day,
      startTime: { lt: endTime },
      endTime: { gt: startTime },
    };

    if (excludeEntryId) {
      where.id = { not: excludeEntryId };
    }

    const conflict = await this.db.timetableEntry.findFirst({ where });

    if (conflict) {
      throw new ConflictException('Classroom is already assigned for this timeslot on ' + day);
    }
  }

  /** Run conflict checks for a draft entry (same timetable only).
   *  ClassroomBooking conflicts are checked separately at publish time. */
  private async checkAllConflicts(
    timetableId: number,
    classroomId: number,
    staffId: number,
    day: string,
    startTime: Date,
    endTime: Date,
    excludeEntryId?: number,
  ) {
    await this.checkClassroomEntryConflict(timetableId, classroomId, day, startTime, endTime, excludeEntryId);
    await this.checkStaffConflict(timetableId, staffId, day, startTime, endTime, excludeEntryId);
  }

  // ─── CRUD: Timetable ──────────────────────────────

  async create(subDepartmentId: number, userId: number, startDateStr: string, endDateStr: string) {
    const semStart = new Date(startDateStr);
    const semEnd = new Date(endDateStr);
    if (isNaN(semStart.getTime()) || isNaN(semEnd.getTime()) || semStart >= semEnd) {
      throw new BadRequestException('Invalid semester start or end date');
    }

    await this.assertManagerAccess(subDepartmentId, userId);

    // Verify sub-department exists
    const subDept = await this.db.subDepartment.findUnique({
      where: { id: subDepartmentId },
    });
    if (!subDept) throw new NotFoundException('Sub-department not found');

    return this.db.timetable.create({
      data: { 
        subDepartmentId,
        semesterStartDate: semStart,
        semesterEndDate: semEnd
      },
      include: {
        subDepartment: { select: { id: true, name: true } },
        entries: true,
      },
    });
  }

  async findAll(userId: number) {
    const user = await this.getUser(userId);

    const where: any = {};

    if (user.role === Role.MANAGER) {
      if (!user.subDepartmentId) {
        throw new ForbiddenException('Manager has no assigned sub-department');
      }
      where.subDepartmentId = user.subDepartmentId;
    } else if (user.role === Role.STAFF) {
      if (!user.subDepartmentId) {
        return [];
      }
      where.subDepartmentId = user.subDepartmentId;
      where.isPublished = true; // Staff only sees published
    }
    // ADMIN sees all — no filter

    return this.db.timetable.findMany({
      where,
      include: {
        subDepartment: {
          select: {
            id: true,
            name: true,
            department: { select: { id: true, name: true } },
          },
        },
        _count: { select: { entries: true } },
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async findOne(id: number, userId: number) {
    const timetable = await this.db.timetable.findUnique({
      where: { id },
      include: {
        subDepartment: {
          select: {
            id: true,
            name: true,
            department: { select: { id: true, name: true } },
          },
        },
        entries: {
          include: {
            staff: { select: { id: true, name: true, email: true } },
            classroom: { select: { id: true, name: true } },
          },
          orderBy: [{ day: 'asc' }, { startTime: 'asc' }],
        },
      },
    });

    if (!timetable) throw new NotFoundException('Timetable not found');

    // Staff can only see published timetables
    const user = await this.getUser(userId);
    if (user.role === Role.STAFF && !timetable.isPublished) {
      throw new ForbiddenException('This timetable is not published yet');
    }

    return timetable;
  }

  async remove(id: number, userId: number) {
    const timetable = await this.db.timetable.findUnique({
      where: { id },
      select: { id: true, subDepartmentId: true, isPublished: true },
    });
    if (!timetable) throw new NotFoundException('Timetable not found');

    await this.assertManagerAccess(timetable.subDepartmentId, userId);

    // If published, cancel associated bookings first
    if (timetable.isPublished) {
      await this.cancelTimetableBookings(id, userId);
    }

    await this.db.timetable.delete({ where: { id } });
    return { message: 'Timetable deleted successfully' };
  }

  // ─── CRUD: Entries ─────────────────────────────────

  async addEntry(timetableId: number, dto: CreateTimetableEntryDto, userId: number) {
    const timetable = await this.db.timetable.findUnique({
      where: { id: timetableId },
      select: { id: true, subDepartmentId: true, isPublished: true },
    });
    if (!timetable) throw new NotFoundException('Timetable not found');
    if (timetable.isPublished) {
      throw new BadRequestException('Cannot add entries to a published timetable. Unpublish first.');
    }

    await this.assertManagerAccess(timetable.subDepartmentId, userId);

    // Validate
    if (!VALID_DAYS.includes(dto.day)) {
      throw new BadRequestException('Day must be Monday through Saturday');
    }
    const startTime = new Date(dto.startTime);
    const endTime = new Date(dto.endTime);
    this.validateTimeBounds(startTime, endTime);

    // Verify staff belongs to the sub-department or is the manager
    await this.validateStaffAssignment(dto.staffId, timetable.subDepartmentId);

    // Verify classroom is active
    const classroom = await this.db.classroom.findFirst({
      where: { id: dto.classroomId, isActive: true },
    });
    if (!classroom) throw new BadRequestException('Classroom not found or inactive');

    // Run conflict checks (scoped to this timetable)
    await this.checkAllConflicts(timetableId, dto.classroomId, dto.staffId, dto.day, startTime, endTime);

    return this.db.timetableEntry.create({
      data: {
        timetableId,
        day: dto.day,
        staffId: dto.staffId,
        batch: dto.batch,
        topic: dto.topic,
        startTime,
        endTime,
        classroomId: dto.classroomId,
      },
      include: {
        staff: { select: { id: true, name: true, email: true } },
        classroom: { select: { id: true, name: true } },
      },
    });
  }

  async updateEntry(timetableId: number, entryId: number, dto: UpdateTimetableEntryDto, userId: number) {
    const entry = await this.db.timetableEntry.findUnique({
      where: { id: entryId },
      include: { timetable: { select: { subDepartmentId: true, isPublished: true } } },
    });
    if (!entry || entry.timetableId !== timetableId) {
      throw new NotFoundException('Entry not found');
    }
    if (entry.timetable.isPublished) {
      throw new BadRequestException('Cannot edit entries of a published timetable. Unpublish first.');
    }

    await this.assertManagerAccess(entry.timetable.subDepartmentId, userId);

    const day = dto.day || entry.day;
    const startTime = dto.startTime ? new Date(dto.startTime) : entry.startTime;
    const endTime = dto.endTime ? new Date(dto.endTime) : entry.endTime;
    const staffId = dto.staffId || entry.staffId;
    const classroomId = dto.classroomId || entry.classroomId;

    if (dto.startTime || dto.endTime) {
      this.validateTimeBounds(startTime, endTime);
    }

    if (dto.staffId) {
      await this.validateStaffAssignment(staffId, entry.timetable.subDepartmentId);
    }

    if (dto.classroomId) {
      const classroom = await this.db.classroom.findFirst({
        where: { id: classroomId, isActive: true },
      });
      if (!classroom) throw new BadRequestException('Classroom not found or inactive');
    }

    // Run conflict checks (exclude self, scoped to this timetable)
    await this.checkAllConflicts(timetableId, classroomId, staffId, day, startTime, endTime, entryId);

    return this.db.timetableEntry.update({
      where: { id: entryId },
      data: {
        day: dto.day,
        staffId: dto.staffId,
        batch: dto.batch,
        topic: dto.topic,
        startTime: dto.startTime ? startTime : undefined,
        endTime: dto.endTime ? endTime : undefined,
        classroomId: dto.classroomId,
      },
      include: {
        staff: { select: { id: true, name: true, email: true } },
        classroom: { select: { id: true, name: true } },
      },
    });
  }

  async removeEntry(timetableId: number, entryId: number, userId: number) {
    const entry = await this.db.timetableEntry.findUnique({
      where: { id: entryId },
      include: { timetable: { select: { subDepartmentId: true, isPublished: true } } },
    });
    if (!entry || entry.timetableId !== timetableId) {
      throw new NotFoundException('Entry not found');
    }
    if (entry.timetable.isPublished) {
      throw new BadRequestException('Cannot remove entries from a published timetable. Unpublish first.');
    }

    await this.assertManagerAccess(entry.timetable.subDepartmentId, userId);

    await this.db.timetableEntry.delete({ where: { id: entryId } });
    return { message: 'Entry deleted successfully' };
  }

  // ─── Staff Validation ──────────────────────────────

  private async validateStaffAssignment(staffId: number, subDepartmentId: number) {
    const staff = await this.db.employee.findUnique({
      where: { id: staffId },
      select: { id: true, role: true, subDepartmentId: true },
    });

    if (!staff) throw new BadRequestException('Staff not found');

    // Staff must belong to the sub-department OR be its manager
    const subDept = await this.db.subDepartment.findUnique({
      where: { id: subDepartmentId },
      select: { managerId: true },
    });

    const isSubDeptStaff = staff.subDepartmentId === subDepartmentId;
    const isManager = subDept?.managerId === staffId;

    if (!isSubDeptStaff && !isManager) {
      throw new BadRequestException(
        'Staff must belong to the sub-department or be its manager',
      );
    }
  }

  // ─── Publish / Unpublish ───────────────────────────

  async publish(timetableId: number, userId: number) {
    const timetable = await this.db.timetable.findUnique({
      where: { id: timetableId },
      include: {
        entries: {
          include: {
            staff: { select: { id: true, name: true } },
            classroom: { select: { id: true, name: true } },
          },
        },
      },
    });

    if (!timetable) throw new NotFoundException('Timetable not found');
    if (timetable.isPublished) {
      throw new BadRequestException('Timetable is already published');
    }
    if (timetable.entries.length === 0) {
      throw new BadRequestException('Cannot publish an empty timetable');
    }

    await this.assertManagerAccess(timetable.subDepartmentId, userId);

    const semStart = new Date(timetable.semesterStartDate);
    const semEnd = new Date(timetable.semesterEndDate);

    // Re-validate all entries before publishing
    for (const entry of timetable.entries) {
      const startTime = new Date(entry.startTime);
      const endTime = new Date(entry.endTime);

      // Check classroom bookings (external conflicts)
      await this.checkClassroomBookingConflict(
        entry.classroomId,
        entry.day,
        startTime,
        endTime,
        semStart,
        semEnd
      );
    }

    // Create recurring ClassroomBookings for each entry across the semester
    
    const dayMapForCursor: Record<string, number> = {
      Sunday: 0, Monday: 1, Tuesday: 2, Wednesday: 3, Thursday: 4, Friday: 5, Saturday: 6
    };
    
    const recurrenceMap: Record<string, string> = {
      Sunday: 'SU', Monday: 'MO', Tuesday: 'TU', Wednesday: 'WE', Thursday: 'TH', Friday: 'FR', Saturday: 'SA'
    };

    for (const entry of timetable.entries) {
      const parentDate = new Date(entry.startTime);
      const rule = `FREQ=WEEKLY;BYDAY=${recurrenceMap[entry.day]}`;
      
      // Create parent booking
      const parent = await this.db.classroomBooking.create({
        data: {
          title: `[Timetable] ${entry.batch} - ${entry.topic}`,
          description: `Auto-created from timetable #${timetableId}. Staff: ${entry.staff.name}`,
          classroomId: entry.classroomId,
          bookedById: userId,
          bookingDate: new Date(DAY_REFERENCE_DATES[entry.day]),
          startTime: entry.startTime,
          endTime: entry.endTime,
          isRecurring: true,
          recurrenceRule: rule,
          recurrenceEnd: semEnd,
        },
      });

      // Generate child occurrences
      const occurrences: any[] = [];
      
      // Use dynamic inputs, aligned to UTC midnight
      let cursor = new Date(Date.UTC(semStart.getUTCFullYear(), semStart.getUTCMonth(), semStart.getUTCDate()));
      const endCursor = new Date(Date.UTC(semEnd.getUTCFullYear(), semEnd.getUTCMonth(), semEnd.getUTCDate()));
      
      const targetDay = dayMapForCursor[entry.day];

      while (cursor <= endCursor) {
        if (cursor.getUTCDay() === targetDay) {
          const parentRef = new Date(DAY_REFERENCE_DATES[entry.day]);
          if (cursor.toISOString().split('T')[0] !== parentRef.toISOString().split('T')[0]) {
            const daysDiff = Math.round((cursor.getTime() - parentRef.getTime()) / (1000 * 60 * 60 * 24));
            const occStart = new Date(entry.startTime.getTime() + daysDiff * 24 * 60 * 60 * 1000);
            const occEnd = new Date(entry.endTime.getTime() + daysDiff * 24 * 60 * 60 * 1000);

            occurrences.push({
              title: `[Timetable] ${entry.batch} - ${entry.topic}`,
              description: `Auto-created from timetable #${timetableId}. Staff: ${entry.staff.name}`,
              classroomId: entry.classroomId,
              bookedById: userId,
              bookingDate: new Date(cursor), // Safe UTC midnight
              startTime: occStart,
              endTime: occEnd,
              isRecurring: false,
              parentBookingId: parent.id,
            });
          }
        }
        cursor.setUTCDate(cursor.getUTCDate() + 1);
      }

      if (occurrences.length > 0) {
        await this.db.classroomBooking.createMany({ data: occurrences });
      }
    }

    // Set published
    return this.db.timetable.update({
      where: { id: timetableId },
      data: { isPublished: true },
      include: {
        subDepartment: { select: { id: true, name: true } },
        entries: {
          include: {
            staff: { select: { id: true, name: true, email: true } },
            classroom: { select: { id: true, name: true } },
          },
        },
      },
    });
  }

  async unpublish(timetableId: number, userId: number) {
    const timetable = await this.db.timetable.findUnique({
      where: { id: timetableId },
      select: { id: true, subDepartmentId: true, isPublished: true },
    });

    if (!timetable) throw new NotFoundException('Timetable not found');
    if (!timetable.isPublished) {
      throw new BadRequestException('Timetable is not published');
    }

    await this.assertManagerAccess(timetable.subDepartmentId, userId);

    // Cancel associated bookings
    await this.cancelTimetableBookings(timetableId, userId);

    return this.db.timetable.update({
      where: { id: timetableId },
      data: { isPublished: false },
      include: {
        subDepartment: { select: { id: true, name: true } },
        entries: {
          include: {
            staff: { select: { id: true, name: true, email: true } },
            classroom: { select: { id: true, name: true } },
          },
        },
      },
    });
  }

  /** Cancel all ClassroomBooking rows created by this timetable */
  private async cancelTimetableBookings(timetableId: number, userId: number) {
    // Find bookings created by this timetable (match by description pattern)
    const pattern = `Auto-created from timetable #${timetableId}`;

    await this.db.classroomBooking.updateMany({
      where: {
        description: { contains: pattern },
        isCancelled: false,
      },
      data: {
        isCancelled: true,
        cancelledAt: new Date(),
        cancelledById: userId,
      },
    });
  }

  // ─── Export ────────────────────────────────────────

  async getExportData(timetableId: number, userId: number) {
    const user = await this.getUser(userId);

    if (user.role === Role.STAFF) {
      throw new ForbiddenException('Staff cannot export timetables');
    }

    const timetable = await this.findOne(timetableId, userId);

    if (user.role === Role.MANAGER) {
      if (user.subDepartmentId !== timetable.subDepartmentId) {
        throw new ForbiddenException('You can only export your own sub-department timetable');
      }
    }

    return timetable;
  }

  // ─── Staff list for manager dropdown ───────────────

  async getAssignableStaff(subDepartmentId: number, userId: number) {
    await this.assertManagerAccess(subDepartmentId, userId);

    // Get sub-department staff + manager
    const subDept = await this.db.subDepartment.findUnique({
      where: { id: subDepartmentId },
      select: { managerId: true },
    });

    const staff = await this.db.employee.findMany({
      where: {
        isActive: true,
        OR: [
          { subDepartmentId, role: Role.STAFF },
          { subDepartmentId, role: Role.MANAGER },
          ...(subDept?.managerId ? [{ id: subDept.managerId }] : []),
        ],
      },
      select: { id: true, name: true, email: true, role: true },
      orderBy: { name: 'asc' },
    });

    return staff;
  }
}
