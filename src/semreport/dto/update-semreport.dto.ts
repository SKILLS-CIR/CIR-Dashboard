import {
  IsDateString,
  IsArray,
  ValidateNested,
  ArrayMinSize,
  IsOptional,
  IsEnum,
} from 'class-validator';
import { Type } from 'class-transformer';
import { CreateSemReportItemDto } from './create-sem-report-item.dto';

export class UpdateSemreportDto {
  @IsOptional()
  @IsDateString({}, { message: 'semesterStartDate must be a valid date string' })
  semesterStartDate?: string;

  @IsOptional()
  @IsDateString({}, { message: 'semesterEndDate must be a valid date string' })
  semesterEndDate?: string;

  @IsOptional()
  @IsArray()
  @ArrayMinSize(1, { message: 'At least one item is required when providing items' })
  @ValidateNested({ each: true })
  @Type(() => CreateSemReportItemDto)
  items?: CreateSemReportItemDto[];

  @IsOptional()
  @IsEnum(['DRAFT', 'SUBMITTED'], {
    message: 'status must be either DRAFT or SUBMITTED',
  })
  status?: 'DRAFT' | 'SUBMITTED';
}
