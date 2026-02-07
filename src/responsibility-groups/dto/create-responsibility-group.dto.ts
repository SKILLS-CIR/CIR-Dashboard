import { IsString, IsOptional, IsInt, IsArray, ValidateNested, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * DTO for creating a new responsibility inline when adding to a group
 */
export class InlineResponsibilityDto {
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsString()
  cycle: string; // Format: "YYYY-MM"

  @IsOptional()
  @IsString()
  startDate?: string;

  @IsOptional()
  @IsString()
  endDate?: string;
}

/**
 * DTO for creating a new Responsibility Group
 */
export class CreateResponsibilityGroupDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  cycle?: string; // Optional: Format "YYYY-MM" for monthly grouping

  /**
   * Optional: IDs of existing responsibilities to add to this group
   */
  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  responsibilityIds?: number[];

  /**
   * Optional: Create new responsibilities inline and add them to this group
   */
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => InlineResponsibilityDto)
  newResponsibilities?: InlineResponsibilityDto[];
}
