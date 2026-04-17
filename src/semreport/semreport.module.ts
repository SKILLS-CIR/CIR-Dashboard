import { Module } from '@nestjs/common';
import { SemreportService } from './semreport.service';
import { SemreportController } from './semreport.controller';
import { DatabaseModule } from '../database/database.module';
import { NotificationModule } from '../notification/notification.module';

@Module({
  imports: [DatabaseModule, NotificationModule],
  controllers: [SemreportController],
  providers: [SemreportService],
  exports: [SemreportService],
})
export class SemreportModule {}
