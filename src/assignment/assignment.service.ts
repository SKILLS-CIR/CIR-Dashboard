import { Injectable, ForbiddenException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { DatabaseService } from 'src/database/database.service';

@Injectable()
export class AssignmentService {
  constructor(private readonly prisma: DatabaseService) { }

  /**
   * Helper: Get date only (strip time component) in UTC
   */
  private getDateOnly(date: Date): Date {
    const d = new Date(date);
    return new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0));
  }

  create(createAssignmentDto: Prisma.ResponsibilityAssignmentCreateInput) {
    return this.prisma.responsibilityAssignment.create({
      data: createAssignmentDto,
    });
  }

  findAll(responsibilityId?: number, staffId?: number) {
    return this.prisma.responsibilityAssignment.findMany({
      where: {
        ...(responsibilityId && { responsibilityId }),
        ...(staffId && { staffId }),
      },
      include: {
        responsibility: true,
        staff: true,
      },
    });
  }

  findOne(id: number) {
    return this.prisma.responsibilityAssignment.findUnique({
      where: { id },
      include: {
        responsibility: true,
        staff: true,
      },
    });
  }

  update(id: number, updateAssignmentDto: Prisma.ResponsibilityAssignmentUpdateInput) {
    return this.prisma.responsibilityAssignment.update({
      where: { id },
      data: updateAssignmentDto,
    });
  }

  remove(id: number) {
    return this.prisma.responsibilityAssignment.delete({
      where: { id },
    });
  }

  /**
   * Scoped findAll - restricts based on user role and sub-department
   * For STAFF: Also filters out responsibilities that are outside their valid date range
   */
  async findAllScoped(
    userId: number,
    userRole: string,
    userSubDepartmentId: number | null,
    staffId?: number,
    responsibilityId?: number,
    status?: string,
  ) {
    const today = this.getDateOnly(new Date());

    // STAFF: Only their own assignments for ACTIVE responsibilities (within date range)
    if (userRole === 'STAFF') {
      const where: any = {
        staffId: userId,
        // Filter: Only responsibilities that are active for TODAY
        responsibility: {
          isActive: true,
          OR: [
            // No dates set (legacy responsibilities - always visible)
            { startDate: null, endDate: null },
            // Within date range
            {
              AND: [
                { OR: [{ startDate: null }, { startDate: { lte: today } }] },
                { OR: [{ endDate: null }, { endDate: { gte: today } }] },
              ],
            },
          ],
        },
      };
      if (responsibilityId) where.responsibilityId = responsibilityId;
      if (status) where.status = status;

      return this.prisma.responsibilityAssignment.findMany({
        where,
        include: {
          responsibility: {
            select: {
              id: true,
              title: true,
              description: true,
              cycle: true,
              subDepartmentId: true,
              startDate: true,
              endDate: true,
              isStaffCreated: true,
            },
          },
          staff: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
              avatarUrl: true,
              gender: true,
              subDepartmentId: true,
              subDepartment: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
          workSubmissions: true,
        },
      });
    }

    // MANAGER: Must have sub-department assigned
    if (userRole === 'MANAGER') {
      if (!userSubDepartmentId) {
        // Manager without sub-department cannot see any assignments
        return [];
      }

      const where: any = {
        responsibility: {
          subDepartmentId: userSubDepartmentId,
        },
      };

      // Apply optional filters (but still scoped to sub-department)
      if (staffId) where.staffId = staffId;
      if (responsibilityId) where.responsibilityId = responsibilityId;
      if (status) where.status = status;

      return this.prisma.responsibilityAssignment.findMany({
        where,
        include: {
          responsibility: {
            select: {
              id: true,
              title: true,
              description: true,
              cycle: true,
              subDepartmentId: true,
            },
          },
          staff: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
              avatarUrl: true,
              gender: true,
              subDepartmentId: true,
              subDepartment: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
          workSubmissions: true,
        },
      });
    }

    // ADMIN: Full access
    if (userRole === 'ADMIN') {
      const where: any = {};
      if (staffId) where.staffId = staffId;
      if (responsibilityId) where.responsibilityId = responsibilityId;
      if (status) where.status = status;

      return this.prisma.responsibilityAssignment.findMany({
        where,
        include: {
          responsibility: {
            select: {
              id: true,
              title: true,
              description: true,
              cycle: true,
              subDepartmentId: true,
            },
          },
          staff: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
              avatarUrl: true,
              gender: true,
              subDepartmentId: true,
              subDepartment: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
          workSubmissions: true,
        },
      });
    }

    // Unknown role - return empty
    return [];
  }
}
