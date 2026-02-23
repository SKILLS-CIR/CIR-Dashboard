import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { DatabaseModule } from './database/database.module';
import { EmployeesModule } from './employees/employees.module';
import { DepartmentsModule } from './departments/departments.module';
import { SubDepartmentsModule } from './sub-departments/sub-departments.module';
import { ResponsibilitiesModule } from './responsibilities/responsibilities.module';
import { AssignmentModule } from './assignment/assignment.module';
import { WorkSubmissionModule } from './work-submission/work-submission.module';
import { CommentsModule } from './comments/comments.module';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { LoggerModule } from './logger/logger.module';
import { AuthModule } from './auth/auth.module';
import { ResponsibilityGroupsModule } from './responsibility-groups/responsibility-groups.module';
import { ProfileModule } from './profile/profile.module';
import { ClassroomBookingModule } from './classroom-booking/classroom-booking.module';
import { ClassroomModule } from './classroom/classroom.module';
import { SemreportModule } from './semreport/semreport.module';

@Module({
  imports: [
    UsersModule,
    DatabaseModule,
    EmployeesModule,
    DepartmentsModule,
    SubDepartmentsModule,
    ResponsibilitiesModule,
    AssignmentModule,
    WorkSubmissionModule,
    CommentsModule,
    ResponsibilityGroupsModule,
    ProfileModule,
    AuthModule,
    ClassroomModule,
    ClassroomBookingModule,
    ThrottlerModule.forRoot([
      {
        name: 'short',
        ttl: 1000,
        limit: 10,
      },
      //rate limiters are added
      {
        name: 'long',
        ttl: 60000,
        limit: 100,
      },
    ]),
    LoggerModule,
    AuthModule,
    ClassroomBookingModule,
    ClassroomModule,
    SemreportModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
