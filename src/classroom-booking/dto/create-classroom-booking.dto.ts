import { IsDateString, IsInt, IsOptional, IsString } from 'class-validator';

export class CreateClassroomBookingDto {
  @IsString()
  title: string;
  @IsOptional()
  @IsString()
  description?: string;
  @IsInt()
  classroomId: number;
  @IsInt()
  bookedById: number;
  @IsDateString()
  bookingDate: string;
  @IsDateString()
  startTime: string;
  @IsDateString()
  endTime: string;
}
