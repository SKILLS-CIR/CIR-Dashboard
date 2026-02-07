import { IsString, IsOptional, IsBoolean } from 'class-validator';

/**
 * DTO for updating a Responsibility Group
 */
export class UpdateResponsibilityGroupDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  cycle?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
