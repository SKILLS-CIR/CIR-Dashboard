import { Injectable, OnModuleInit } from '@nestjs/common';
import { DatabaseService } from 'src/database/database.service';

// Default settings that are seeded on application startup
const DEFAULT_SETTINGS: { key: string; value: string; label: string }[] = [
  {
    key: 'work_submission_lookback_days',
    value: '7',
    label: 'Submission Lookback Days',
  },
];

@Injectable()
export class SettingsService implements OnModuleInit {
  constructor(private readonly db: DatabaseService) {}

  /**
   * Seed default settings on module initialization.
   * Uses upsert to avoid duplicates — existing values are NOT overwritten.
   */
  async onModuleInit() {
    for (const setting of DEFAULT_SETTINGS) {
      await this.db.appSettings.upsert({
        where: { key: setting.key },
        update: {}, // Do not overwrite existing values
        create: {
          key: setting.key,
          value: setting.value,
          label: setting.label,
        },
      });
    }
  }

  /** Get all settings */
  async findAll() {
    return this.db.appSettings.findMany({
      orderBy: { key: 'asc' },
    });
  }

  /** Get a single setting by key */
  async findByKey(key: string) {
    return this.db.appSettings.findUnique({
      where: { key },
    });
  }

  /** Update a setting's value by key */
  async updateByKey(key: string, value: string) {
    return this.db.appSettings.update({
      where: { key },
      data: { value },
    });
  }
}
