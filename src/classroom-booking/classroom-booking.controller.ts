import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ClassroomBookingService } from './classroom-booking.service';
import { CreateClassroomBookingDto } from './dto/create-classroom-booking.dto';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';

@Controller('classroom-bookings')
export class ClassroomBookingController {
  constructor(
    private readonly classroomBookingService: ClassroomBookingService,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Body() dto: CreateClassroomBookingDto, @Req() req: any) {
    return this.classroomBookingService.create(dto, req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Get('classroom/:classroomId/date/:date')
  findByDate(
    @Param('classroomId') classroomId: string,
    @Param('date') date: string,
  ) {
    return this.classroomBookingService.findByDate(+classroomId, date);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  cancel(@Param('id') id: string, @Req() req: any) {
    return this.classroomBookingService.cancel(+id, req.user.id);
  }
}