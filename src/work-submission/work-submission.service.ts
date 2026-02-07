import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { DatabaseService } from 'src/database/database.service';

@Injectable()
export class WorkSubmissionService {
  constructor(private readonly databaseService: DatabaseService) { }

  /**
   * Helper: Get date only (strip time component) in UTC
   */
  private getDateOnly(date: Date): Date {
    const d = new Date(date);
    d.setUTCHours(0, 0, 0, 0);
    return d;
  }

  /**
   * Helper: Get today's date only (UTC)
   */
  private getTodayDateOnly(): Date {
    return this.getDateOnly(new Date());
  }

  /**
   * Helper: Check if two dates are the same day
   */
  private isSameDay(date1: Date, date2: Date): boolean {
    const d1 = this.getDateOnly(date1);
    const d2 = this.getDateOnly(date2);
    return d1.getTime() === d2.getTime();
  }
  private validateWorkProofInput(
    workProofType?: any,
    workProofUrl?: any,
    workProofText?: any,
  ) {
    const urlProvided =
      typeof workProofUrl === 'string' && workProofUrl.trim().length > 0;
    const textProvided =
      typeof workProofText === 'string' && workProofText.trim().length > 0;
    if (!workProofType && (urlProvided || textProvided)) {
      throw new BadRequestException(
        'workProofType is required when providing work proof',
      );
    }

    if (!workProofType) return;

    const type = String(workProofType).toUpperCase();
    const url = typeof workProofUrl === 'string' ? workProofUrl.trim() : '';
    const text = typeof workProofText === 'string' ? workProofText.trim() : '';

    if (type === 'TEXT') {
      if (!text) {
        throw new BadRequestException(
          'workProofText is required when workProofType is TEXT',
        );
      }
      if (url) {
        throw new BadRequestException(
          'workProofUrl must NOT be provided when workProofType is TEXT',
        );
      }
      return;
    }

    if (type === 'PDF' || type === 'IMAGE') {
      if (!url) {
        throw new BadRequestException(
          `workProofUrl is required when workProofType is ${type}`,
        );
      }
      if (text) {
        throw new BadRequestException(
          `workProofText must NOT be provided when workProofType is ${type}`,
        );
      }
      try {
        const parsed = new URL(url);
        if (!['http:', 'https:'].includes(parsed.protocol)) {
          throw new Error();
        }
      } catch {
        throw new BadRequestException('Invalid workProofUrl');
      }

      return;
    }

    throw new BadRequestException(
      'Invalid workProofType. Allowed values: PDF, IMAGE, TEXT',
    );
  }
  async create(createWorkSubmissionDto: Prisma.WorkSubmissionCreateInput) {
    try {
      return await this.databaseService.workSubmission.create({
        data: createWorkSubmissionDto,
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new NotFoundException(
            'Referenced record not found. Ensure assignment and staff IDs exist.',
          );
        }
        if (error.code === 'P2002') {
          throw new BadRequestException(
            'A work submission already exists for this assignment on this date.',
          );
        }
      }
      throw error;
    }
  }

  async findAll(staffId?: number, verifiedById?: number, assignmentId?: number) {
    const where: Prisma.WorkSubmissionWhereInput = {};

    if (staffId) {
      where.staffId = staffId;
    }

    if (verifiedById) {
      where.verifiedById = verifiedById;
    }

    if (assignmentId) {
      where.assignmentId = assignmentId;
    }

    return this.databaseService.workSubmission.findMany({
      where,
      include: {
        assignment: {
          include: {
            responsibility: true,
          },
        },
        staff: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
        verifiedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        comments: {
          include: {
            author: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });
  }

  async findOne(id: number) {
    return this.databaseService.workSubmission.findUnique({
      where: { id },
      include: {
        assignment: {
          include: {
            responsibility: true,
          },
        },
        staff: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
        verifiedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        comments: {
          include: {
            author: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });
  }

  async update(id: number, updateWorkSubmissionDto: Prisma.WorkSubmissionUpdateInput) {
    try {
      return await this.databaseService.workSubmission.update({
        where: { id },
        data: updateWorkSubmissionDto,
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new NotFoundException(
            'Record not found. Ensure work submission ID and any referenced employee IDs exist.',
          );
        }
      }
      throw error;
    }
  }

  async remove(id: number) {
    try {
      return await this.databaseService.workSubmission.delete({
        where: { id },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new NotFoundException(`Work submission with ID ${id} not found.`);
        }
      }
      throw error;
    }
  }

  /**
   * Scoped findAll - restricts data based on user role and date filtering
   */
  async findAllScoped(
    userId: number,
    userRole: string,
    userSubDepartmentId: number | null,
    staffId?: number,
    verifiedById?: number,
    assignmentId?: number,
    dateFilter?: Date,
  ) {
    const where: any = {};

    // Date filtering
    if (dateFilter) {
      where.workDate = this.getDateOnly(dateFilter);
    }

    // STAFF: Only their own submissions
    if (userRole === 'STAFF') {
      where.staffId = userId;
    }

    // MANAGER: Only their sub-department submissions
    if (userRole === 'MANAGER') {
      if (!userSubDepartmentId) {
        return []; // No sub-department assigned, return empty
      }
      where.assignment = {
        responsibility: {
          subDepartmentId: userSubDepartmentId,
        },
      };
    }

    // ADMIN: No restrictions

    // Apply optional filters
    if (staffId) where.staffId = staffId;
    if (verifiedById) where.verifiedById = verifiedById;
    if (assignmentId) where.assignmentId = assignmentId;

    return this.databaseService.workSubmission.findMany({
      where,
      include: {
        assignment: {
          include: {
            responsibility: true,
          },
        },
        staff: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
        verifiedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        workDate: 'desc',
      },
    });
  }

  /**
   * Verify a work submission - restricted to ADMIN or MANAGER of same department
   */
  async verifySubmission(
    submissionId: number,
    verifierId: number,
    verifierRole: string,
    verifierSubDepartmentId: number | null,
    managerComment: string,
    approved: boolean,
  ) {
    // 1. Get submission with full chain
    const submission = await this.databaseService.workSubmission.findUnique({
      where: { id: submissionId },
      include: {
        assignment: {
          include: {
            responsibility: {
              include: {
                subDepartment: true,
              },
            },
          },
        },
      },
    });

    if (!submission) {
      throw new NotFoundException(`Work submission with ID ${submissionId} not found`);
    }

    // 2. Check if already verified

    //add for manager to approve and reject 
    // if (submission.verifiedAt) {
    //   throw new BadRequestException('This submission has already been verified');
    // }

    // 3. Get the sub-department this submission belongs to
    const submissionSubDepartmentId = submission.assignment?.responsibility?.subDepartmentId;

    // 4. Authorization check
    if (verifierRole === 'STAFF') {
      throw new ForbiddenException('Staff cannot verify submissions');
    }

    if (verifierRole === 'MANAGER') {
      if (!submissionSubDepartmentId || !verifierSubDepartmentId) {
        throw new ForbiddenException('Cannot determine sub-department for verification');
      }
      if (submissionSubDepartmentId !== verifierSubDepartmentId) {
        throw new ForbiddenException('Managers can only verify submissions within their sub-department');
      }
    }
    // ADMIN can verify any submission

    // 5. Update submission status (per-submission, not assignment-level)
    const newStatus = approved ? 'VERIFIED' : 'REJECTED';

    // Update only the WorkSubmission - NOT the assignment status
    // This allows each day's submission to have its own status
    return this.databaseService.workSubmission.update({
      where: { id: submissionId },
      data: {
        status: newStatus,
        verifiedAt: new Date(),
        verifiedById: verifierId,
        managerComment,
        rejectionReason: approved ? null : managerComment,
      },
      include: {
        assignment: {
          include: {
            responsibility: true,
          },
        },
        staff: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
        verifiedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
  }

  /**
   * Resubmit a rejected work submission - allows staff to update and resubmit rejected work
   * This resets the status to SUBMITTED and clears verification fields
   */
  async resubmitRejected(
    submissionId: number,
    staffId: number,
    updateData: {
      hoursWorked?: number;
      staffComment?: string;
      workProofType?: 'PDF' | 'IMAGE' | 'TEXT';
      workProofUrl?: string;
      workProofText?: string;
    },
  ) {
    // 1. Get the submission
    const submission = await this.databaseService.workSubmission.findUnique({
      where: { id: submissionId },
      include: {
        assignment: {
          include: {
            responsibility: true,
          },
        },
      },
    });

    if (!submission) {
      throw new NotFoundException(`Work submission with ID ${submissionId} not found`);
    }

    // 2. Check ownership - only the staff who created this can resubmit
    if (submission.staffId !== staffId) {
      throw new ForbiddenException('You can only resubmit your own work submissions');
    }

    // 3. Check if submission is rejected - only rejected submissions can be resubmitted
    if (submission.status !== 'REJECTED') {
      throw new BadRequestException(
        `Only rejected submissions can be resubmitted. Current status: ${submission.status}`,
      );
    }

    // 4. Update the submission with new data and reset to SUBMITTED status
    return this.databaseService.workSubmission.update({
      where: { id: submissionId },
      data: {
        hoursWorked: updateData.hoursWorked ?? submission.hoursWorked,
        staffComment: updateData.staffComment ?? submission.staffComment,
        workProofType: updateData.workProofType ?? submission.workProofType,
        workProofUrl: updateData.workProofUrl ?? submission.workProofUrl,
        workProofText: updateData.workProofText ?? submission.workProofText,
        status: 'SUBMITTED',
        // Clear verification fields so it can be reviewed again
        verifiedAt: null,
        verifiedById: null,
        // Keep the rejection reason for history, but add that it was resubmitted
        // managerComment is preserved so staff can see original feedback
      },
      include: {
        assignment: {
          include: {
            responsibility: true,
          },
        },
        staff: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
        verifiedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
  }

  /**
   * Protected update - prevents verification fields from being set directly
   */
  async updateProtected(
    id: number,
    updateDto: Prisma.WorkSubmissionUpdateInput,
    userId: number,
    userRole: string,
  ) {
    // Block verification fields from regular update
    if (
      updateDto.verifiedAt !== undefined ||
      updateDto.verifiedBy !== undefined
    ) {
      if (userRole === 'STAFF') {
        throw new ForbiddenException('Staff cannot set verification fields');
      }
      // For MANAGER/ADMIN, redirect to proper verification flow
      throw new BadRequestException(
        'Use POST /work-submission/:id/verify endpoint to verify submissions',
      );
    }

    // Staff can only update their own submissions
    if (userRole === 'STAFF') {
      const submission = await this.findOne(id);
      if (!submission) {
        throw new NotFoundException(`Work submission with ID ${id} not found`);
      }
      if (submission.staffId !== userId) {
        throw new ForbiddenException('Staff can only update their own submissions');
      }
    }
    this.validateWorkProofInput(
      (updateDto as any).workProofType,
      (updateDto as any).workProofUrl,
      (updateDto as any).workProofText,
    );
    return this.update(id, updateDto);
  }

  /**
   * Protected create - ensures staff can only submit their own work for CURRENT DATE only
   */
  async createProtected(
    createWorkSubmissionDto: Prisma.WorkSubmissionCreateInput,
    userId: number,
    userRole: string,
  ) {
    // 1. Extract staffId from the DTO
    const staffIdFromDto = (createWorkSubmissionDto.staff as any)?.connect?.id;

    if (!staffIdFromDto) {
      throw new BadRequestException('Staff ID is required');
    }

    // 2. STAFF can only submit their own work
    if (userRole === 'STAFF') {
      if (staffIdFromDto !== userId) {
        throw new ForbiddenException('Staff can only submit their own work');
      }
    }

    // 3. MANAGER cannot submit work submissions
    if (userRole === 'MANAGER') {
      throw new ForbiddenException('Managers cannot submit work. Only verify.');
    }

    // 4. Verify assignment exists and belongs to this staff
    const assignmentId = (createWorkSubmissionDto.assignment as any)?.connect?.id;

    if (!assignmentId) {
      throw new BadRequestException('Assignment ID is required');
    }

    const assignment = await this.databaseService.responsibilityAssignment.findUnique({
      where: { id: assignmentId },
      include: {
        responsibility: true,
      },
    });

    if (!assignment) {
      throw new NotFoundException(`Assignment with ID ${assignmentId} not found`);
    }

    if (assignment.staffId !== staffIdFromDto) {
      throw new ForbiddenException('Cannot submit work for an assignment not assigned to this staff');
    }

    // 5. Validate workDate - must be current date only (no backdating or future dating)
    const today = this.getTodayDateOnly();
    const workDate = createWorkSubmissionDto.workDate
      ? this.getDateOnly(new Date(createWorkSubmissionDto.workDate as string | Date))
      : today;

    if (!this.isSameDay(workDate, today)) {
      throw new BadRequestException(
        'Work submissions can only be made for the current date. Backdated and future-dated submissions are not allowed.',
      );
    }

    // 6. Check if responsibility is active for this date
    const responsibility = assignment.responsibility;
    if (responsibility) {
      const startDate = responsibility.startDate ? this.getDateOnly(responsibility.startDate) : null;
      const endDate = responsibility.endDate ? this.getDateOnly(responsibility.endDate) : null;

      if (startDate && today < startDate) {
        throw new BadRequestException('This responsibility has not started yet');
      }
      if (endDate && today > endDate) {
        throw new BadRequestException('This responsibility has expired and is no longer active');
      }
    }
    this.validateWorkProofInput(
      (createWorkSubmissionDto as any).workProofType,
      (createWorkSubmissionDto as any).workProofUrl,
      (createWorkSubmissionDto as any).workProofText,
    );
    // 7. Check if submission already exists for this assignment on this date
    const existingSubmission = await this.databaseService.workSubmission.findFirst({
      where: {
        assignmentId,
        workDate: today,
      },
    });

    if (existingSubmission) {
      throw new BadRequestException(
        'Work submission already exists for this assignment today. Use update instead.',
      );
    }

    // 8. Create the submission with workDate set to today
    return this.create({
      ...createWorkSubmissionDto,
      workDate: today,
    });
  }

  /**
   * Get daily submissions for a specific date (with scoping)
   */
  async getDailySubmissions(
    userId: number,
    userRole: string,
    userSubDepartmentId: number | null,
    date: Date,
  ) {
    const targetDate = this.getDateOnly(date);
    const where: any = {
      workDate: targetDate,
    };

    // Apply role-based scoping
    if (userRole === 'STAFF') {
      where.staffId = userId;
    } else if (userRole === 'MANAGER') {
      if (!userSubDepartmentId) {
        return [];
      }
      where.assignment = {
        responsibility: {
          subDepartmentId: userSubDepartmentId,
        },
      };
    }
    // ADMIN: No restrictions

    return this.databaseService.workSubmission.findMany({
      where,
      include: {
        assignment: {
          include: {
            responsibility: true,
          },
        },
        staff: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
        verifiedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
  }

  /**
   * Calculate daily total hours from VERIFIED submissions only
   */
  async getDailyTotalHours(
    staffId: number,
    date: Date,
  ): Promise<{ totalHours: number; verifiedHours: number; pendingHours: number }> {
    const targetDate = this.getDateOnly(date);

    const submissions = await this.databaseService.workSubmission.findMany({
      where: {
        staffId,
        workDate: targetDate,
      },
      include: {
        assignment: true,
      },
    });

    let verifiedHours = 0;
    let pendingHours = 0;

    for (const submission of submissions) {
      const hours = submission.hoursWorked || 0;
      // Use submission.status (per-day status) instead of assignment.status
      if (submission.status === 'VERIFIED') {
        verifiedHours += hours;
      } else if (submission.status === 'SUBMITTED') {
        pendingHours += hours;
      }
      // Rejected submissions don't count towards any total
    }

    return {
      totalHours: verifiedHours + pendingHours,
      verifiedHours,
      pendingHours,
    };
  }

  /**
   * Check if a past date is locked (missed day - cannot submit)
   */
  isDateLocked(date: Date): boolean {
    const today = this.getTodayDateOnly();
    const targetDate = this.getDateOnly(date);
    return targetDate < today;
  }

  /**
   * Get calendar view for a date range (staff's submissions with status)
   */
  async getCalendarView(
    staffId: number,
    startDate: Date,
    endDate: Date,
  ) {
    const start = this.getDateOnly(startDate);
    const end = this.getDateOnly(endDate);

    const submissions = await this.databaseService.workSubmission.findMany({
      where: {
        staffId,
        workDate: {
          gte: start,
          lte: end,
        },
      },
      include: {
        assignment: true,
      },
      orderBy: {
        workDate: 'asc',
      },
    });

    // Group by date
    const calendarData: Record<string, {
      date: string;
      submissions: any[];
      totalHours: number;
      verifiedHours: number;
      isLocked: boolean;
    }> = {};

    for (const submission of submissions) {
      const dateKey = submission.workDate.toISOString().split('T')[0];

      if (!calendarData[dateKey]) {
        calendarData[dateKey] = {
          date: dateKey,
          submissions: [],
          totalHours: 0,
          verifiedHours: 0,
          isLocked: this.isDateLocked(submission.workDate),
        };
      }

      const hours = submission.hoursWorked || 0;
      calendarData[dateKey].submissions.push(submission);
      calendarData[dateKey].totalHours += hours;

      // Use submission.status (per-day status) instead of assignment.status
      if (submission.status === 'VERIFIED') {
        calendarData[dateKey].verifiedHours += hours;
      }
    }

    return Object.values(calendarData);
  }
}
