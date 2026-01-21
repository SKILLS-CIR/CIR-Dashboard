import { Injectable, ForbiddenException, BadRequestException } from '@nestjs/common';
import { Prisma, SubDepartmentType } from '@prisma/client';
import { DatabaseService } from 'src/database/database.service';

@Injectable()
export class ResponsibilitiesService {
  constructor(private readonly databaseService: DatabaseService) { }

  async create(createResponsibilityDto: Prisma.ResponsibilityCreateInput) {
    return this.databaseService.responsibility.create({
      data: createResponsibilityDto,
    });
  }

  /**
   * Create a responsibility with date validation
   * Managers can set startDate and endDate
   * Staff can create same-day responsibilities for themselves (if enabled)
   * When staff creates, it auto-assigns to them for today only
   */
  async createWithDateValidation(
    createResponsibilityDto: Prisma.ResponsibilityCreateInput,
    userId: number,
    userRole: string,
    userSubDepartmentId: number | null,
    startDate?: Date,
    endDate?: Date,
    isStaffCreated?: boolean,
  ) {
    // Validate that user has a subDepartmentId
    if (!userSubDepartmentId) {
      throw new BadRequestException('User must be assigned to a sub-department to create responsibilities');
    }

    // Staff creating their own responsibility
    if (userRole === 'STAFF') {
      // Staff can ONLY create for themselves - automatically set isStaffCreated
      const today = this.getDateOnly(new Date());
      const start = startDate ? this.getDateOnly(new Date(startDate)) : today;
      const end = endDate ? this.getDateOnly(new Date(endDate)) : today;

      if (start.getTime() !== today.getTime() || end.getTime() !== today.getTime()) {
        throw new BadRequestException('Staff can only create responsibilities for the current day');
      }

      const todayEnd = this.getEndOfDay(new Date());

      // Use transaction to create responsibility and auto-assign to this staff member
      const result = await this.databaseService.$transaction(async (tx) => {
        // Create the responsibility with required relations
        const responsibility = await tx.responsibility.create({
          data: {
            title: (createResponsibilityDto as any).title,
            description: (createResponsibilityDto as any).description,
            cycle: (createResponsibilityDto as any).cycle,
            startDate: today,
            endDate: todayEnd,
            isStaffCreated: true,
            createdBy: {
              connect: { id: userId },
            },
            subDepartment: {
              connect: { id: userSubDepartmentId },
            },
          },
        });

        // Auto-create assignment for this staff member for today
        const assignment = await tx.responsibilityAssignment.create({
          data: {
            responsibilityId: responsibility.id,
            staffId: userId,
            status: 'PENDING',
            dueDate: today,
          },
        });

        return {
          ...responsibility,
          assignments: [assignment],
        };
      });

      return result;
    }

    // Manager/Admin setting date range
    if (userRole === 'MANAGER' || userRole === 'ADMIN') {
      const start = startDate ? this.getDateOnly(new Date(startDate)) : undefined;
      const end = endDate ? this.getEndOfDay(new Date(endDate)) : undefined;

      if (start && end && end < start) {
        throw new BadRequestException('End date cannot be before start date');
      }

      const responsibility = await this.databaseService.responsibility.create({
        data: {
          title: (createResponsibilityDto as any).title,
          description: (createResponsibilityDto as any).description,
          cycle: (createResponsibilityDto as any).cycle,
          startDate: start,
          endDate: end,
          isStaffCreated: false,
          createdBy: {
            connect: { id: userId },
          },
          subDepartment: {
            connect: { id: userSubDepartmentId },
          },
        },
      });

      return responsibility;
    }

    throw new BadRequestException('Invalid user role');
  }

  // Filter responsibilities by SubDepartment type
  async findAll(type?: SubDepartmentType, subDepartmentId?: number) {
    const where: Prisma.ResponsibilityWhereInput = {};

    // Filter by subdepartment type
    if (type) {
      where.subDepartment = {
        type,
      };
    }

    // Filter by specific subdepartment ID
    if (subDepartmentId) {
      where.subDepartmentId = subDepartmentId;
    }

    return this.databaseService.responsibility.findMany({
      where,
      include: {
        subDepartment: true, // Include subdepartment details
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        assignments: {
          include: {
            staff: {
              select: {
                id: true,
                name: true,
                email: true,
                role: true,
              },
            },
            workSubmissions: true,
          },
        },
      },
    });
  }

  async findAllByDepartment(userDepartmentId: number, userRole: string) {
    if (userRole === 'ADMIN') {
      return this.databaseService.responsibility.findMany();
    }
    // Manager/Staff: only their department
    return this.databaseService.responsibility.findMany({
      where: {
        subDepartment: {
          departmentId: userDepartmentId,
        },
      },
    });
  }

  async findOne(id: number) {
    return this.databaseService.responsibility.findUnique({
      where: {
        id,
      },
      include: {
        subDepartment: true,
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        assignments: {
          include: {
            staff: {
              select: {
                id: true,
                name: true,
                email: true,
                role: true,
              },
            },
            workSubmissions: true,
          },
        },
        subResponsibilities: true,
        parent: true,
      },
    });
  }

  async update(id: number, updateResponsibilityDto: Prisma.ResponsibilityUpdateInput) {
    return this.databaseService.responsibility.update({
      where: {
        id,
      },
      data: updateResponsibilityDto,
    });
  }

  async remove(id: number) {
    return this.databaseService.responsibility.delete({
      where: {
        id,
      },
    });
  }

  // Get all employees assigned to a responsibility
  async getAssignedEmployees(responsibilityId: number) {
    return this.databaseService.responsibilityAssignment.findMany({
      where: {
        responsibilityId,
      },
      include: {
        staff: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            jobTitle: true,
          },
        },
        workSubmissions: true,
      },
    });
  }

  /**
   * Scoped findAll - restricts based on user role
   * Staff can only see responsibilities that are:
   * 1. Assigned to them
   * 2. Within the valid date range (between startDate and endDate)
   * 3. Active
   * 
   * Managers/Admins can see all responsibilities including expired ones
   */
  async findAllScoped(
    userId: number,
    userRole: string,
    userSubDepartmentId: number | null,
    includeExpired?: boolean,  // For managers/admins to see expired
  ) {
    const where: any = {};
    const today = this.getDateOnly(new Date());

    // STAFF: Only responsibilities assigned to them AND within valid date range
    if (userRole === 'STAFF') {
      where.assignments = {
        some: {
          staffId: userId,
        },
      };
      where.isActive = true;

      // Only show responsibilities within date range for staff
      where.OR = [
        // No dates set (legacy responsibilities)
        { startDate: null, endDate: null },
        // Within date range
        {
          AND: [
            { OR: [{ startDate: null }, { startDate: { lte: today } }] },
            { OR: [{ endDate: null }, { endDate: { gte: today } }] },
          ],
        },
      ];
    }

    // MANAGER: Only their sub-department responsibilities
    if (userRole === 'MANAGER') {
      if (!userSubDepartmentId) {
        return [];
      }
      where.subDepartmentId = userSubDepartmentId;

      // Optionally exclude expired unless explicitly requested
      if (!includeExpired) {
        where.OR = [
          { endDate: null },
          { endDate: { gte: today } },
        ];
      }
    }

    // ADMIN: No restrictions (can see all including expired)

    return this.databaseService.responsibility.findMany({
      where,
      include: {
        subDepartment: true,
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        assignments: {
          include: {
            staff: {
              select: {
                id: true,
                name: true,
                email: true,
                role: true,
              },
            },
          },
        },
      },
    });
  }

  /**
   * Get active responsibilities for a specific date
   * Used for daily submission workflow
   */
  async getActiveForDate(
    userId: number,
    userRole: string,
    userSubDepartmentId: number | null,
    date: Date,
  ) {
    const targetDate = this.getDateOnly(date);
    const where: any = {
      isActive: true,
      OR: [
        // No dates set (always visible)
        { startDate: null, endDate: null },
        // Within date range
        {
          AND: [
            { OR: [{ startDate: null }, { startDate: { lte: targetDate } }] },
            { OR: [{ endDate: null }, { endDate: { gte: targetDate } }] },
          ],
        },
      ],
    };

    if (userRole === 'STAFF') {
      where.assignments = {
        some: {
          staffId: userId,
        },
      };
    }

    if (userRole === 'MANAGER') {
      if (!userSubDepartmentId) return [];
      where.subDepartmentId = userSubDepartmentId;
    }

    return this.databaseService.responsibility.findMany({
      where,
      include: {
        subDepartment: true,
        assignments: {
          where: userRole === 'STAFF' ? { staffId: userId } : undefined,
          include: {
            staff: {
              select: {
                id: true,
                name: true,
                email: true,
                role: true,
              },
            },
            workSubmissions: true,
          },
        },
      },
    });
  }

  /**
   * Check if a responsibility is visible to a user on a specific date
   */
  async isVisibleToUser(
    responsibilityId: number,
    userId: number,
    userRole: string,
    date: Date,
  ): Promise<boolean> {
    const responsibility = await this.databaseService.responsibility.findUnique({
      where: { id: responsibilityId },
      include: {
        assignments: {
          where: { staffId: userId },
        },
      },
    });

    if (!responsibility || !responsibility.isActive) {
      return false;
    }

    // Admin/Manager can always see
    if (userRole === 'ADMIN' || userRole === 'MANAGER') {
      return true;
    }

    // Staff must be assigned
    if (responsibility.assignments.length === 0) {
      return false;
    }

    // Check date range for staff
    const targetDate = this.getDateOnly(date);

    if (responsibility.startDate && targetDate < this.getDateOnly(responsibility.startDate)) {
      return false;
    }

    if (responsibility.endDate && targetDate > this.getDateOnly(responsibility.endDate)) {
      return false;
    }

    return true;
  }

  /**
   * Helper: Get date only (strip time component) - UTC based to avoid timezone issues
   */
  private getDateOnly(date: Date): Date {
    const d = new Date(date);
    // Use UTC to avoid timezone conversion issues
    return new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0));
  }

  /**
   * Helper: Get end of day (23:59:59.999) - UTC based to avoid timezone issues
   */
  private getEndOfDay(date: Date): Date {
    const d = new Date(date);
    // Use UTC to avoid timezone conversion issues
    return new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999));
  }
}