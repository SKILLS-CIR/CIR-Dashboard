"use strict";

import { Controller, Post, Body, Request, UseGuards, Get, UseInterceptors, UploadedFile, BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { ProfileService } from './profile.service';
import { UpdateAvatarDto } from './dto/update-avatar.dto';

// Ensure uploads directory exists
const uploadsDir = './uploads';
if (!existsSync(uploadsDir)) {
    mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer storage
const storage = diskStorage({
    destination: (req, file, callback) => {
        // Ensure directory exists before saving
        if (!existsSync(uploadsDir)) {
            mkdirSync(uploadsDir, { recursive: true });
        }
        callback(null, uploadsDir);
    },
    filename: (req, file, callback) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        const ext = extname(file.originalname);
        callback(null, `avatar-${uniqueSuffix}${ext}`);
    },
});

// File filter to only allow images
const imageFileFilter = (req: any, file: any, callback: any) => {
    const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (allowedMimes.includes(file.mimetype)) {
        callback(null, true);
    } else {
        callback(new BadRequestException('Only image files are allowed (jpg, jpeg, png, webp)'), false);
    }
};

@Controller('profile')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ProfileController {
    constructor(private readonly profileService: ProfileService) { }

    @Get()
    @Roles('ADMIN', 'MANAGER', 'STAFF')
    async getProfile(@Request() req) {
        return this.profileService.getProfile(req.user.id);
    }

    @Post('avatar')
    @Roles('ADMIN', 'MANAGER', 'STAFF')
    async updateAvatar(
        @Request() req,
        @Body() updateAvatarDto: UpdateAvatarDto
    ) {
        return this.profileService.updateAvatar(req.user.id, updateAvatarDto);
    }

    @Post('avatar/upload')
    @Roles('ADMIN', 'MANAGER', 'STAFF')
    @UseInterceptors(FileInterceptor('file', {
        storage: storage,
        fileFilter: imageFileFilter,
        limits: {
            fileSize: 5 * 1024 * 1024, // 5MB limit
        },
    }))
    async uploadAvatar(
        @Request() req,
        @UploadedFile() file: Express.Multer.File,
        @Body('gender') gender: string,
    ) {
        if (!file) {
            throw new BadRequestException('No file uploaded');
        }

        // Construct the URL for the uploaded file using the request's origin
        const protocol = req.protocol || 'http';
        const host = req.get('host') || 'localhost:3000';
        const avatarUrl = `${protocol}://${host}/uploads/${file.filename}`;

        // Update the user's avatar in the database
        await this.profileService.updateAvatar(req.user.id, {
            avatarUrl,
            gender: (gender || 'male') as 'male' | 'female',
        });

        return {
            avatarUrl,
            message: 'Avatar uploaded successfully',
        };
    }
}
