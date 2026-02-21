import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { CreateSemreportDto } from './dto/create-semreport.dto';
import { UpdateSemreportDto } from './dto/update-semreport.dto';
import { ReviewSemreportDto } from './dto/review-semreport.dto';

// Standard includes for returning full report data
const REPORT_INCLUDES = {
  staff: {
    select: {
      id: true,
      name: true,
      email: true,
      avatarUrl: true,
      departmentId: true,
      subDepartmentId: true,
      department: { select: { id: true, name: true } },
      subDepartment: { select: { id: true, name: true } },
    },
  },
  managerReviewedBy: { select: { id: true, name: true, email: true } },
  adminReviewedBy: { select: { id: true, name: true, email: true } },
  rejectedBy: { select: { id: true, name: true, email: true } },
  items: {
    include: {
      attachments: true,
    },
    orderBy: { id: 'asc' as const },
  },
};

@Injectable()
export class SemreportService {
  constructor(private readonly db: DatabaseService) {}

  // ─────────────────────────────────────────────
  // STAFF: Create a sem report
  // ─────────────────────────────────────────────
  async create(staffId: number, dto: CreateSemreportDto) {
    this.validateBatchNames(dto.items);

    const targetStatus =
      dto.status === 'SUBMITTED' ? 'UNDER_MANAGER_REVIEW' : 'DRAFT';

    const report = await this.db.semReport.create({
      data: {
        semesterStartDate: new Date(dto.semesterStartDate),
        semesterEndDate: new Date(dto.semesterEndDate),
        status: targetStatus,
        staffId,
        items: {
          create: dto.items.map((item) => ({
            type: item.type,
            name: item.type === 'BATCH' ? item.name.toUpperCase() : item.name,
            description: item.description,
            attachments: item.attachmentUrls?.length
              ? {
                  create: item.attachmentUrls.map((url) => ({
                    fileName: this.extractFileName(url),
                    fileUrl: url,
                  })),
                }
              : undefined,
          })),
        },
      },
      include: REPORT_INCLUDES,
    });

    return report;
  }

  // ─────────────────────────────────────────────
  // STAFF: Update own report (DRAFT or REJECTED only)
  // ─────────────────────────────────────────────
  async update(staffId: number, reportId: number, dto: UpdateSemreportDto) {
    const report = await this.db.semReport.findUnique({
      where: { id: reportId },
    });

    if (!report) throw new NotFoundException('Sem report not found');
    if (report.staffId !== staffId)
      throw new ForbiddenException('You can only update your own reports');
    if (!['DRAFT', 'REJECTED'].includes(report.status))
      throw new BadRequestException(
        `Cannot update a report with status ${report.status}. Only DRAFT or REJECTED reports can be edited.`,
      );

    if (dto.items) {
      this.validateBatchNames(dto.items);
    }

    // Determine new status
    let newStatus = report.status;
    if (dto.status === 'SUBMITTED') {
      newStatus = 'UNDER_MANAGER_REVIEW';
    } else if (dto.status === 'DRAFT') {
      newStatus = 'DRAFT';
    }

    // If items provided, delete old items and recreate (simpler than diffing)
    if (dto.items) {
      await this.db.semReportItem.deleteMany({
        where: { semReportId: reportId },
      });
    }

    const updated = await this.db.semReport.update({
      where: { id: reportId },
      data: {
        ...(dto.semesterStartDate && {
          semesterStartDate: new Date(dto.semesterStartDate),
        }),
        ...(dto.semesterEndDate && {
          semesterEndDate: new Date(dto.semesterEndDate),
        }),
        status: newStatus,
        // Clear rejection info on resubmission
        ...(dto.status === 'SUBMITTED' && {
          rejectionReason: null,
          rejectedById: null,
        }),
        ...(dto.items && {
          items: {
            create: dto.items.map((item) => ({
              type: item.type,
              name:
                item.type === 'BATCH' ? item.name.toUpperCase() : item.name,
              description: item.description,
              attachments: item.attachmentUrls?.length
                ? {
                    create: item.attachmentUrls.map((url) => ({
                      fileName: this.extractFileName(url),
                      fileUrl: url,
                    })),
                  }
                : undefined,
            })),
          },
        }),
      },
      include: REPORT_INCLUDES,
    });

    return updated;
  }

  // ─────────────────────────────────────────────
  // STAFF: Get own reports
  // ─────────────────────────────────────────────
  async getMyReports(staffId: number) {
    return this.db.semReport.findMany({
      where: { staffId },
      include: REPORT_INCLUDES,
      orderBy: { createdAt: 'desc' },
    });
  }

  // ─────────────────────────────────────────────
  // Any role: Get single report by ID (with auth)
  // ─────────────────────────────────────────────
  async getById(
    reportId: number,
    requesterId: number,
    requesterRole: string,
  ) {
    const report = await this.db.semReport.findUnique({
      where: { id: reportId },
      include: REPORT_INCLUDES,
    });

    if (!report) throw new NotFoundException('Sem report not found');

    // STAFF can only see their own
    if (requesterRole === 'STAFF' && report.staffId !== requesterId) {
      throw new ForbiddenException('You can only view your own reports');
    }

    // MANAGER can only see reports from their sub-department
    if (requesterRole === 'MANAGER') {
      await this.assertManagerOwnsSubDepartment(
        requesterId,
        report.staff.subDepartmentId,
      );
    }

    // ADMIN can see any
    return report;
  }

  // ─────────────────────────────────────────────
  // MANAGER: Get reports for review (own sub-dept)
  // ─────────────────────────────────────────────
  async getReportsForManagerReview(managerId: number) {
    const subDeptId = await this.getManagerSubDepartmentId(managerId);

    return this.db.semReport.findMany({
      where: {
        staff: { subDepartmentId: subDeptId },
        status: {
          in: [
            'UNDER_MANAGER_REVIEW',
            'UNDER_ADMIN_REVIEW',
            'APPROVED',
            'REJECTED',
          ],
        },
      },
      include: REPORT_INCLUDES,
      orderBy: { createdAt: 'desc' },
    });
  }

  // ─────────────────────────────────────────────
  // ADMIN: Get reports for review (all or by dept)
  // ─────────────────────────────────────────────
  async getReportsForAdminReview(departmentId?: number) {
    return this.db.semReport.findMany({
      where: {
        status: {
          in: [
            'UNDER_MANAGER_REVIEW',
            'UNDER_ADMIN_REVIEW',
            'APPROVED',
            'REJECTED',
          ],
        },
        ...(departmentId && {
          staff: { departmentId },
        }),
      },
      include: REPORT_INCLUDES,
      orderBy: { createdAt: 'desc' },
    });
  }

  // ─────────────────────────────────────────────
  // MANAGER: Review a sem report (APPROVE/REJECT)
  // ─────────────────────────────────────────────
  async managerReview(
    managerId: number,
    reportId: number,
    dto: ReviewSemreportDto,
  ) {
    const report = await this.db.semReport.findUnique({
      where: { id: reportId },
      include: {
        staff: { select: { id: true, subDepartmentId: true } },
      },
    });

    if (!report) throw new NotFoundException('Sem report not found');
    if (report.status !== 'UNDER_MANAGER_REVIEW')
      throw new BadRequestException(
        'Only reports with status UNDER_MANAGER_REVIEW can be reviewed by a manager',
      );

    // Verify manager owns this sub-department
    await this.assertManagerOwnsSubDepartment(
      managerId,
      report.staff.subDepartmentId,
    );

    if (dto.action === 'REJECT' && !dto.rejectionReason) {
      throw new BadRequestException(
        'Rejection reason is mandatory when rejecting a report',
      );
    }

    if (dto.action === 'APPROVE') {
      return this.db.semReport.update({
        where: { id: reportId },
        data: {
          status: 'UNDER_ADMIN_REVIEW',
          managerReviewedById: managerId,
          managerReviewedAt: new Date(),
        },
        include: REPORT_INCLUDES,
      });
    } else {
      return this.db.semReport.update({
        where: { id: reportId },
        data: {
          status: 'REJECTED',
          rejectionReason: dto.rejectionReason,
          rejectedById: managerId,
          // Clear previous admin review data if any
          adminReviewedById: null,
          adminReviewedAt: null,
        },
        include: REPORT_INCLUDES,
      });
    }
  }

  // ─────────────────────────────────────────────
  // ADMIN: Review a sem report (APPROVE/REJECT)
  // ─────────────────────────────────────────────
  async adminReview(
    adminId: number,
    reportId: number,
    dto: ReviewSemreportDto,
  ) {
    const report = await this.db.semReport.findUnique({
      where: { id: reportId },
    });

    if (!report) throw new NotFoundException('Sem report not found');
    if (report.status !== 'UNDER_ADMIN_REVIEW')
      throw new BadRequestException(
        'Only reports with status UNDER_ADMIN_REVIEW can be reviewed by an admin',
      );

    if (dto.action === 'REJECT' && !dto.rejectionReason) {
      throw new BadRequestException(
        'Rejection reason is mandatory when rejecting a report',
      );
    }

    if (dto.action === 'APPROVE') {
      return this.db.semReport.update({
        where: { id: reportId },
        data: {
          status: 'APPROVED',
          adminReviewedById: adminId,
          adminReviewedAt: new Date(),
        },
        include: REPORT_INCLUDES,
      });
    } else {
      return this.db.semReport.update({
        where: { id: reportId },
        data: {
          status: 'REJECTED',
          rejectionReason: dto.rejectionReason,
          rejectedById: adminId,
        },
        include: REPORT_INCLUDES,
      });
    }
  }

  // ─────────────────────────────────────────────
  // ADMIN/MANAGER: Get reports by staff ID
  // ─────────────────────────────────────────────
  async getByStaffId(
    staffId: number,
    requesterId: number,
    requesterRole: string,
  ) {
    if (requesterRole === 'MANAGER') {
      const staff = await this.db.employee.findUnique({
        where: { id: staffId },
        select: { subDepartmentId: true },
      });
      if (!staff) throw new NotFoundException('Staff not found');
      await this.assertManagerOwnsSubDepartment(
        requesterId,
        staff.subDepartmentId,
      );
    }

    return this.db.semReport.findMany({
      where: {
        staffId,
        status: {
          in: [
            'UNDER_MANAGER_REVIEW',
            'UNDER_ADMIN_REVIEW',
            'APPROVED',
            'REJECTED',
          ],
        },
      },
      include: REPORT_INCLUDES,
      orderBy: { createdAt: 'desc' },
    });
  }

  // ─────────────────────────────────────────────
  // STAFF: Delete own draft report
  // ─────────────────────────────────────────────
  async delete(staffId: number, reportId: number) {
    const report = await this.db.semReport.findUnique({
      where: { id: reportId },
    });

    if (!report) throw new NotFoundException('Sem report not found');
    if (report.staffId !== staffId)
      throw new ForbiddenException('You can only delete your own reports');
    if (report.status !== 'DRAFT')
      throw new BadRequestException('Only draft reports can be deleted');

    return this.db.semReport.delete({
      where: { id: reportId },
    });
  }

  // ─────────────────────────────────────────────
  // HELPERS
  // ─────────────────────────────────────────────

  private validateBatchNames(
    items: { type: string; name: string }[],
  ) {
    const batchItems = items.filter((i) => i.type === 'BATCH');
    for (const item of batchItems) {
      if (!/^[A-Z0-9\s]+$/.test(item.name)) {
        throw new BadRequestException(
          `Batch name "${item.name}" must be in uppercase (letters, numbers, spaces only)`,
        );
      }
    }
  }

  /**
   * Resolve the sub-department ID that a manager owns.
   * First checks SubDepartment.managerId, then falls back to the
   * manager's own subDepartmentId from their Employee record.
   */
  private async getManagerSubDepartmentId(managerId: number): Promise<number> {
    // 1. Check if any SubDepartment has this employee set as manager
    const subDept = await this.db.subDepartment.findUnique({
      where: { managerId },
    });
    if (subDept) return subDept.id;

    // 2. Fallback: use the manager's own subDepartmentId
    const manager = await this.db.employee.findUnique({
      where: { id: managerId },
      select: { subDepartmentId: true },
    });
    if (manager?.subDepartmentId) return manager.subDepartmentId;

    throw new ForbiddenException('You are not managing any sub-department');
  }

  private async assertManagerOwnsSubDepartment(
    managerId: number,
    staffSubDeptId: number | null,
  ) {
    const managerSubDeptId = await this.getManagerSubDepartmentId(managerId);
    if (managerSubDeptId !== staffSubDeptId) {
      throw new ForbiddenException(
        'You can only access reports from staff in your own sub-department',
      );
    }
  }

  private extractFileName(url: string): string {
    return url.split('/').pop() || url;
  }
}
