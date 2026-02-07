import { IsInt, IsOptional, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { InlineResponsibilityDto } from './create-responsibility-group.dto';

/**
 * DTO for adding responsibilities to an existing group
 */
export class AddResponsibilitiesToGroupDto {
  /**
   * IDs of existing responsibilities to add to this group
   */
  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  responsibilityIds?: number[];

  /**
   * Create new responsibilities inline and add them to this group
   */
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => InlineResponsibilityDto)
  newResponsibilities?: InlineResponsibilityDto[];

  /**
   * Optional display order offset for newly added items
   */
  @IsOptional()
  @IsInt()
  displayOrderStart?: number;
}
