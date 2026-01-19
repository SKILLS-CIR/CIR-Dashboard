import { Controller, Get, Post, Body, Patch, Param, Delete,Query,Request,UseGuards } from '@nestjs/common';
import { AssignmentService } from './assignment.service';
import  {Prisma, Responsibility,Employee} from "@prisma/client";
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';

@Controller('assignment')
export class AssignmentController {
  constructor(private readonly assignmentService: AssignmentService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Body() createAssignmentDto: Prisma.ResponsibilityAssignmentCreateInput) {
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
