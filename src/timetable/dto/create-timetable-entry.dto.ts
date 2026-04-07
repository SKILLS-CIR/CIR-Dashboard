import { IsInt, IsString, Matches, IsIn } from 'class-validator';

export class CreateTimetableEntryDto {
  @IsString()
  @IsIn(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'], {
    message: 'Day must be Monday through Saturday',
  })
  day: string;

  @IsInt()
  staffId: number;

  @IsString()
  batch: string;

  @IsString()
  topic: string;

  @IsString({ message: 'startTime must be an ISO 8601 string' })
  startTime: string;

  @IsString({ message: 'endTime must be an ISO 8601 string' })
  endTime: string;

  @IsInt()
  classroomId: number;
}
