import { IsArray, IsBoolean, IsEnum, IsInt, IsOptional, IsString } from 'class-validator';

export enum NoticeTargetType {
  ALL = 'ALL',
  DEPARTMENT = 'DEPARTMENT',
  SUB_DEPARTMENT = 'SUB_DEPARTMENT',
  INDIVIDUAL = 'INDIVIDUAL',
}

export class CreateNotificationDto {
  @IsInt()
  userId: number;

  @IsString()
  title: string;

  @IsString()
  message: string;

  @IsString()
  type: string;

  @IsOptional()
  @IsInt()
  entityId?: number;

  @IsOptional()
  @IsString()
  entityType?: string;
}

export class CreateBroadcastNoticeDto {
  @IsString()
  title: string;

  @IsString()
  message: string;

  @IsEnum(NoticeTargetType)
  targetType: NoticeTargetType;

  @IsOptional()
  @IsInt()
  targetId?: number; // departmentId or subDepartmentId

  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  userIds?: number[]; // for INDIVIDUAL targeting

  @IsOptional()
  @IsBoolean()
  isPinned?: boolean;
}
