import { Controller, Get, Post, Body, Patch, Param, Delete, Query, Request, UseGuards, ForbiddenException, BadRequestException } from '@nestjs/common';
import { AssignmentService } from './assignment.service';
import { Prisma, Responsibility, Employee } from "@prisma/client";
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { DatabaseService } from 'src/database/database.service';

@Controller('assignment')
export class AssignmentController {
  constructor(
    private readonly assignmentService: AssignmentService,
    private readonly databaseService: DatabaseService,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  async create(
    @Body() createAssignmentDto: Prisma.ResponsibilityAssignmentCreateInput,
    @Request() req,
  ) {
    const userId = req.user.id;
    const userRole = req.user.role;
    const userSubDepartmentId = req.user.subDepartmentId;

    // For MANAGER, validate that the responsibility belongs to their sub-department
    if (userRole === 'MANAGER') {
      if (!userSubDepartmentId) {
        throw new ForbiddenException('Manager must be assigned to a sub-department to create assignments');
      }

      // Extract responsibility ID from the connect object
      const respConnect = createAssignmentDto.responsibility?.connect;
      if (!respConnect?.id) {
        throw new BadRequestException('Responsibility ID is required');
      }

      const responsibility = await this.databaseService.responsibility.findUnique({
        where: { id: respConnect.id },
        select: { subDepartmentId: true },
      });

      if (!responsibility) {
        throw new BadRequestException('Responsibility not found');
      }

      if (responsibility.subDepartmentId !== userSubDepartmentId) {
        throw new ForbiddenException('You can only create assignments for responsibilities in your sub-department');
      }

      // Also validate that the staff belongs to the same sub-department
      const staffConnect = createAssignmentDto.staff?.connect;
      if (staffConnect?.id) {
        const staff = await this.databaseService.employee.findUnique({
          where: { id: staffConnect.id },
          select: { subDepartmentId: true, role: true },
        });

        if (!staff) {
          throw new BadRequestException('Staff member not found');
        }

        if (staff.role !== 'STAFF') {
          throw new BadRequestException('Can only assign responsibilities to STAFF members');
        }

        if (staff.subDepartmentId !== userSubDepartmentId) {
          throw new ForbiddenException('You can only assign responsibilities to staff in your sub-department');
        }
      }
    }

    return this.assignmentService.create(createAssignmentDto);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @Roles('ADMIN', 'MANAGER', 'STAFF')
  findAll(
    @Query('staffId') staffId?: string,
    @Query('responsibilityId') responsibilityId?: string,
    @Query('status') status?: string,
    @Request() req?,
  ) {
    return this.assignmentService.findAllScoped(
      req.user.id,
      req.user.role,
      req.user.subDepartmentId,  // ← Make sure this is passed
      staffId ? +staffId : undefined,
      responsibilityId ? +responsibilityId : undefined,
      status,
    );
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  findOne(@Param('id') id: string) {
    return this.assignmentService.findOne(+id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  update(@Param('id') id: string, @Body() updateAssignmentDto: Prisma.ResponsibilityAssignmentUpdateInput) {
    return this.assignmentService.update(+id, updateAssignmentDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  remove(@Param('id') id: string) {
    return this.assignmentService.remove(+id);
  }
}
