import { Module } from '@nestjs/common';
import { ClassroomBookingService } from './classroom-booking.service';
import { ClassroomBookingController } from './classroom-booking.controller';
import { DatabaseModule } from 'src/database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [ClassroomBookingController],
  providers: [ClassroomBookingService],
})
export class ClassroomBookingModule {}
