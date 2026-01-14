import { Module } from '@nestjs/common';
import { WorkSubmissionService } from './work-submission.service';
import { WorkSubmissionController } from './work-submission.controller';
import { DatabaseModule } from 'src/database/database.module';


@Module({
  imports: [DatabaseModule],
  controllers: [WorkSubmissionController],
  providers: [WorkSubmissionService],
})
export class WorkSubmissionModule {}
