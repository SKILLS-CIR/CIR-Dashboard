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
  Req,
} from '@nestjs/common';
import { SemreportService } from './semreport.service';
import { CreateSemreportDto } from './dto/create-semreport.dto';
import { UpdateSemreportDto } from './dto/update-semreport.dto';
import { ReviewSemreportDto } from './dto/review-semreport.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('semreports')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SemreportController {
  constructor(private readonly semreportService: SemreportService) {}

  // ─── STAFF: Create a new sem report ───
  @Post()
  @Roles('STAFF')
  create(@Req() req, @Body() dto: CreateSemreportDto) {
    return this.semreportService.create(req.user.id, dto);
  }

  // ─── STAFF: Get own reports ───
  @Get('my-reports')
  @Roles('STAFF')
  getMyReports(@Req() req) {
    return this.semreportService.getMyReports(req.user.id);
  }

  // ─── MANAGER: Get reports for review ───
  @Get('manager/review')
  @Roles('MANAGER')
  getManagerReports(@Req() req) {
    // console.log('=== REQ.USER ===', JSON.stringify(req.user));
    return this.semreportService.getReportsForManagerReview(req.user.id);
  }

  // ─── ADMIN: Get all reports for review ───
  @Get('admin/review')
  @Roles('ADMIN')
  getAdminReports(@Query('departmentId') departmentId?: string) {
    return this.semreportService.getReportsForAdminReview(
      departmentId ? parseInt(departmentId, 10) : undefined,
    );
  }

  // ─── ADMIN/MANAGER: Get reports by staff ID ───
  @Get('staff/:staffId')
  @Roles('ADMIN', 'MANAGER')
  getByStaffId(
    @Req() req,
    @Param('staffId', ParseIntPipe) staffId: number,
  ) {
    return this.semreportService.getByStaffId(
      staffId,
      req.user.id,
      req.user.role,
    );
  }

  // ─── MANAGER: Review (approve/reject) ───
  @Patch(':id/manager-review')
  @Roles('MANAGER')
  managerReview(
    @Req() req,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ReviewSemreportDto,
  ) {
    return this.semreportService.managerReview(req.user.id, id, dto);
  }

  // ─── ADMIN: Review (approve/reject) ───
  @Patch(':id/admin-review')
  @Roles('ADMIN')
  adminReview(
    @Req() req,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ReviewSemreportDto,
  ) {
    return this.semreportService.adminReview(req.user.id, id, dto);
  }

  // ─── STAFF: Update own report ───
  @Patch(':id')
  @Roles('STAFF')
  update(
    @Req() req,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateSemreportDto,
  ) {
    return this.semreportService.update(req.user.id, id, dto);
  }

  // ─── Any role: Get single report by ID ───
  @Get(':id')
  @Roles('ADMIN', 'MANAGER', 'STAFF')
  getById(@Req() req, @Param('id', ParseIntPipe) id: number) {
    return this.semreportService.getById(id, req.user.id, req.user.role);
  }

  // ─── STAFF: Delete own draft ───
  @Delete(':id')
  @Roles('STAFF')
  delete(@Req() req, @Param('id', ParseIntPipe) id: number) {
    return this.semreportService.delete(req.user.id, id);
  }
}
