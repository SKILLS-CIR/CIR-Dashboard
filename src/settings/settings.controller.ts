import {
  Controller,
  Get,
  Put,
  Param,
  Body,
  UseGuards,
  NotFoundException,
} from '@nestjs/common';
import { SettingsService } from './settings.service';
import { UpdateSettingDto } from './dto/update-setting.dto';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { SkipThrottle } from '@nestjs/throttler';

@Controller('settings')
@SkipThrottle()
@UseGuards(JwtAuthGuard, RolesGuard)
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  /** GET /settings — Returns all settings (any authenticated user) */
  @Get()
  async findAll() {
    return this.settingsService.findAll();
  }

  /** GET /settings/:key — Returns a single setting by key */
  @Get(':key')
  async findByKey(@Param('key') key: string) {
    const setting = await this.settingsService.findByKey(key);
    if (!setting) {
      throw new NotFoundException(`Setting with key "${key}" not found`);
    }
    return setting;
  }

  /** PUT /settings/:key — Update a setting (ADMIN only) */
  @Put(':key')
  @Roles('ADMIN')
  async update(
    @Param('key') key: string,
    @Body() dto: UpdateSettingDto,
  ) {
    const existing = await this.settingsService.findByKey(key);
    if (!existing) {
      throw new NotFoundException(`Setting with key "${key}" not found`);
    }
    return this.settingsService.updateByKey(key, dto.value);
  }
}
