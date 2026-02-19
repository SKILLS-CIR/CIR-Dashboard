import { PartialType } from '@nestjs/mapped-types';
import { CreateClassroomBookingDto } from './create-classroom-booking.dto';

export class UpdateClassroomBookingDto extends PartialType(
  CreateClassroomBookingDto,
) {}
