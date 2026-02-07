import { IsInt, IsArray, IsOptional, IsString } from 'class-validator';

/**
 * DTO for assigning a responsibility group to staff members
 * This will create individual ResponsibilityAssignment records for each
 * responsibility in the group, using the existing assignment logic.
 */
export class AssignGroupToStaffDto {
  /**
   * Array of staff IDs to assign this group to
   */
  @IsArray()
  @IsInt({ each: true })
  staffIds: number[];

  /**
   * Optional due date for all assignments created
   */
  @IsOptional()
  @IsString()
  dueDate?: string;
}
