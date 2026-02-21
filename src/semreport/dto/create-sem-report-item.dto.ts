import {
  IsEnum,
  IsString,
  IsNotEmpty,
  IsOptional,
  IsArray,
} from 'class-validator';

export class CreateSemReportItemDto {
  @IsEnum(['BATCH', 'RESPONSIBILITY'], {
    message: 'type must be either BATCH or RESPONSIBILITY',
  })
  type: 'BATCH' | 'RESPONSIBILITY';

  @IsString()
  @IsNotEmpty({ message: 'Item name is required' })
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  attachmentUrls?: string[];
}
