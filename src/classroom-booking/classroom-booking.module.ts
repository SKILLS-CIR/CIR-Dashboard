import { Module } from '@nestjs/common';
import { ClassroomBookingService } from './classroom-booking.service';
import { ClassroomBookingController } from './classroom-booking.controller';

@Module({
  controllers: [ClassroomBookingController],
  providers: [ClassroomBookingService],
})
export class ClassroomBookingModule {}
