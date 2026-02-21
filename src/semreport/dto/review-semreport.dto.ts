import { IsEnum, IsOptional, IsString } from 'class-validator';

export class ReviewSemreportDto {
  @IsEnum(['APPROVE', 'REJECT'], {
    message: 'action must be either APPROVE or REJECT',
  })
  action: 'APPROVE' | 'REJECT';

  @IsOptional()
  @IsString()
  rejectionReason?: string;
}
