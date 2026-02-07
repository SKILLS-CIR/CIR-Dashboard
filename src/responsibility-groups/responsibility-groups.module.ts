import { Module } from '@nestjs/common';
import { ResponsibilityGroupsService } from './responsibility-groups.service';
import { ResponsibilityGroupsController } from './responsibility-groups.controller';
import { DatabaseModule } from 'src/database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [ResponsibilityGroupsController],
  providers: [ResponsibilityGroupsService],
  exports: [ResponsibilityGroupsService],
})
export class ResponsibilityGroupsModule {}
