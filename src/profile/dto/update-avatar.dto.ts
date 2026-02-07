"use strict";

import { IsOptional, IsString, IsEnum } from 'class-validator';

export class UpdateAvatarDto {
    @IsString()
    avatarUrl: string;

    @IsOptional()
    @IsString()
    gender?: 'male' | 'female';
}
