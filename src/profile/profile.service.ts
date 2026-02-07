"use strict";

import { Injectable } from '@nestjs/common';
import { DatabaseService } from 'src/database/database.service';
import { UpdateAvatarDto } from './dto/update-avatar.dto';

@Injectable()
export class ProfileService {
    constructor(private readonly databaseService: DatabaseService) { }

    async getProfile(userId: number) {
        const user = await this.databaseService.employee.findUnique({
            where: { id: userId },
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                jobTitle: true,
                avatarUrl: true,
                gender: true,
                isActive: true,
                department: {
                    select: { id: true, name: true },
                },
                subDepartment: {
                    select: { id: true, name: true },
                },
            },
        });
        return user;
    }

    async updateAvatar(userId: number, dto: UpdateAvatarDto) {
        // Build update data, only include gender if provided
        const updateData: any = {
            avatarUrl: dto.avatarUrl,
        };

        if (dto.gender) {
            updateData.gender = dto.gender.toUpperCase() as 'MALE' | 'FEMALE';
        }

        const updated = await this.databaseService.employee.update({
            where: { id: userId },
            data: updateData,
            select: {
                id: true,
                avatarUrl: true,
                gender: true,
            },
        });
        return updated;
    }
}
