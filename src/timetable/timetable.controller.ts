import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { TimetableService } from './timetable.service';
import { CreateTimetableEntryDto } from './dto/create-timetable-entry.dto';
import { UpdateTimetableEntryDto } from './dto/update-timetable-entry.dto';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';

@Controller('timetables')
export class TimetableController {
  constructor(private readonly timetableService: TimetableService) {}

  // ─── Timetable CRUD ─────────────────────────────────

  @UseGuards(JwtAuthGuard)
  @Post()
  create(
    @Body('subDepartmentId') subDepartmentId: number,
    @Body('startDate') startDate: string,
    @Body('endDate') endDate: string,
    @Req() req: any
  ) {
    if (!startDate || !endDate) {
      throw new BadRequestException('Start date and end date are required for creating a timetable');
    }
    return this.timetableService.create(subDepartmentId, req.user.id, startDate, endDate);
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  findAll(@Req() req: any) {
    return this.timetableService.findAll(req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  findOne(@Param('id') id: string, @Req() req: any) {
    return this.timetableService.findOne(+id, req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  remove(@Param('id') id: string, @Req() req: any) {
    return this.timetableService.remove(+id, req.user.id);
  }

  // ─── Entry CRUD ─────────────────────────────────────

  @UseGuards(JwtAuthGuard)
  @Post(':id/entries')
  addEntry(
    @Param('id') id: string,
    @Body() dto: CreateTimetableEntryDto,
    @Req() req: any,
  ) {
    return this.timetableService.addEntry(+id, dto, req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id/entries/:entryId')
  updateEntry(
    @Param('id') id: string,
    @Param('entryId') entryId: string,
    @Body() dto: UpdateTimetableEntryDto,
    @Req() req: any,
  ) {
    return this.timetableService.updateEntry(+id, +entryId, dto, req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id/entries/:entryId')
  removeEntry(
    @Param('id') id: string,
    @Param('entryId') entryId: string,
    @Req() req: any,
  ) {
    return this.timetableService.removeEntry(+id, +entryId, req.user.id);
  }

  // ─── Publish / Unpublish ─────────────────────────────

  @UseGuards(JwtAuthGuard)
  @Post(':id/publish')
  publish(@Param('id') id: string, @Req() req: any) {
    return this.timetableService.publish(+id, req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/unpublish')
  unpublish(@Param('id') id: string, @Req() req: any) {
    return this.timetableService.unpublish(+id, req.user.id);
  }

  // ─── Export ──────────────────────────────────────────

  @UseGuards(JwtAuthGuard)
  @Get(':id/export')
  getExportData(@Param('id') id: string, @Req() req: any) {
    return this.timetableService.getExportData(+id, req.user.id);
  }

  // ─── Staff list for the entry form dropdown ─────────

  @UseGuards(JwtAuthGuard)
  @Get('sub-department/:subDeptId/staff')
  getAssignableStaff(
    @Param('subDeptId') subDeptId: string,
    @Req() req: any,
  ) {
    return this.timetableService.getAssignableStaff(+subDeptId, req.user.id);
  }
}
