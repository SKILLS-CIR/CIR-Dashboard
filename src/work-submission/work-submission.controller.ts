import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  ParseIntPipe,
  UseGuards,
  Request,
} from '@nestjs/common';
import { WorkSubmissionService } from './work-submission.service';
import { Prisma } from '@prisma/client';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { VerifySubmissionDto } from './dto/verify-submission.dto';

@Controller('work-submission')
@UseGuards(JwtAuthGuard, RolesGuard)
export class WorkSubmissionController {
  constructor(private readonly workSubmissionService: WorkSubmissionService) {}

  @Post()
  @Roles('ADMIN', 'STAFF')  // ← Changed: Removed MANAGER
  async create(
    @Body() createWorkSubmissionDto: Prisma.WorkSubmissionCreateInput,
    @Request() req,
  ) {
    return this.workSubmissionService.createProtected(
      createWorkSubmissionDto,
      req.user.id,
      req.user.role,
    );
  }

  @Get()
  @Roles('ADMIN', 'MANAGER', 'STAFF')
  findAll(
    @Query('staffId') staffId?: string,
    @Query('verifiedById') verifiedById?: string,
    @Query('assignmentId') assignmentId?: string,
    @Query('date') dateStr?: string,
    @Request() req?,
  ) {
    const dateFilter = dateStr ? new Date(dateStr) : undefined;
    return this.workSubmissionService.findAllScoped(
      req.user.id,
      req.user.role,
      req.user.subDepartmentId,
      staffId ? +staffId : undefined,
      verifiedById ? +verifiedById : undefined,
      assignmentId ? +assignmentId : undefined,
      dateFilter,
    );
  }

  /**
   * Get today's submissions for current user (convenience endpoint)
   */
  @Get('today')
  @Roles('ADMIN', 'MANAGER', 'STAFF')
  async getToday(@Request() req) {
    return this.workSubmissionService.getDailySubmissions(
      req.user.id,
      req.user.role,
      req.user.subDepartmentId,
      new Date(),
    );
  }

  /**
   * Get submissions for a specific date
   */
  @Get('daily/:date')
  @Roles('ADMIN', 'MANAGER', 'STAFF')
  async getDailySubmissions(
    @Param('date') dateStr: string,
    @Request() req,
  ) {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) {
      throw new Error('Invalid date format. Use YYYY-MM-DD');
    }
    return this.workSubmissionService.getDailySubmissions(
      req.user.id,
      req.user.role,
      req.user.subDepartmentId,
      date,
    );
  }

  /**
   * Get daily hours summary (verified vs pending)
   */
  @Get('daily-hours/:staffId/:date')
  @Roles('ADMIN', 'MANAGER', 'STAFF')
  async getDailyHours(
    @Param('staffId', ParseIntPipe) staffId: number,
    @Param('date') dateStr: string,
    @Request() req,
  ) {
    // Staff can only see their own hours
    if (req.user.role === 'STAFF' && req.user.id !== staffId) {
      throw new Error('Staff can only view their own daily hours');
    }
    
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) {
      throw new Error('Invalid date format. Use YYYY-MM-DD');
    }
    
    return this.workSubmissionService.getDailyTotalHours(staffId, date);
  }

  /**
   * Get calendar view for date range
   */
  @Get('calendar/:staffId')
  @Roles('ADMIN', 'MANAGER', 'STAFF')
  async getCalendarView(
    @Param('staffId', ParseIntPipe) staffId: number,
    @Query('startDate') startDateStr: string,
    @Query('endDate') endDateStr: string,
    @Request() req,
  ) {
    // Staff can only see their own calendar
    if (req.user.role === 'STAFF' && req.user.id !== staffId) {
      throw new Error('Staff can only view their own calendar');
    }
    
    const startDate = new Date(startDateStr);
    const endDate = new Date(endDateStr);
    
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      throw new Error('Invalid date format. Use YYYY-MM-DD');
    }
    
    return this.workSubmissionService.getCalendarView(staffId, startDate, endDate);
  }

  @Get(':id')
  @Roles('ADMIN', 'MANAGER', 'STAFF')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.workSubmissionService.findOne(id);
  }

  @Patch(':id')
  @Roles('ADMIN', 'MANAGER', 'STAFF')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateWorkSubmissionDto: Prisma.WorkSubmissionUpdateInput,
    @Request() req,
  ) {
    // Use protected update to block verification fields
    return this.workSubmissionService.updateProtected(
      id,
      updateWorkSubmissionDto,
      req.user.id,
      req.user.role,
    );
  }

  @Delete(':id')
  @Roles('ADMIN')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.workSubmissionService.remove(id);
  }

  /**
   * Resubmit a rejected work submission
   * Staff can update their rejected submission with corrected details
   */
  @Post(':id/resubmit')
  @Roles('STAFF', 'ADMIN')
  async resubmit(
    @Param('id', ParseIntPipe) id: number,
    @Body() resubmitDto: {
      hoursWorked?: number;
      staffComment?: string;
      workProofType?: 'PDF' | 'IMAGE' | 'TEXT';
      workProofUrl?: string;
      workProofText?: string;
    },
    @Request() req,
  ) {
    return this.workSubmissionService.resubmitRejected(
      id,
      req.user.id,
      resubmitDto,
    );
  }

  /**
   * NEW: Dedicated verification endpoint
   * Only ADMIN or MANAGER of same department can access
   */
  @Post(':id/verify')
  @Roles('ADMIN', 'MANAGER')
  async verify(
    @Param('id', ParseIntPipe) id: number,
    @Body() verifyDto: VerifySubmissionDto,
    @Request() req,
  ) {
    return this.workSubmissionService.verifySubmission(
      id,
      req.user.id,
      req.user.role,
      req.user.subDepartmentId,  // ← Changed from departmentId
      verifyDto.managerComment || '',
      verifyDto.approved,
    );
  }
}
