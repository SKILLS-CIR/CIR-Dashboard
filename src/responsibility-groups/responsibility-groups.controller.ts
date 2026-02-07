import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ResponsibilityGroupsService } from './responsibility-groups.service';
import {
  CreateResponsibilityGroupDto,
  UpdateResponsibilityGroupDto,
  AddResponsibilitiesToGroupDto,
  AssignGroupToStaffDto,
} from './dto';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';

@Controller('responsibility-groups')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ResponsibilityGroupsController {
  constructor(
    private readonly responsibilityGroupsService: ResponsibilityGroupsService,
  ) {}

  /**
   * Create a new responsibility group
   * POST /responsibility-groups
   */
  @Post()
  @Roles('ADMIN', 'MANAGER')
  create(
    @Body() createDto: CreateResponsibilityGroupDto,
    @Request() req,
  ) {
    return this.responsibilityGroupsService.create(
      createDto,
      req.user.id,
      req.user.role,
      req.user.subDepartmentId,
    );
  }

  /**
   * Get all responsibility groups (scoped by role)
   * GET /responsibility-groups
   */
  @Get()
  @Roles('ADMIN', 'MANAGER')
  findAll(@Request() req) {
    return this.responsibilityGroupsService.findAll(
      req.user.id,
      req.user.role,
      req.user.subDepartmentId,
    );
  }

  /**
   * Get a single responsibility group by ID
   * GET /responsibility-groups/:id
   */
  @Get(':id')
  @Roles('ADMIN', 'MANAGER')
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @Request() req,
  ) {
    return this.responsibilityGroupsService.findOne(
      id,
      req.user.id,
      req.user.role,
      req.user.subDepartmentId,
    );
  }

  /**
   * Update a responsibility group
   * PATCH /responsibility-groups/:id
   */
  @Patch(':id')
  @Roles('ADMIN', 'MANAGER')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdateResponsibilityGroupDto,
    @Request() req,
  ) {
    return this.responsibilityGroupsService.update(
      id,
      updateDto,
      req.user.id,
      req.user.role,
      req.user.subDepartmentId,
    );
  }

  /**
   * Delete a responsibility group
   * DELETE /responsibility-groups/:id
   * Note: This only deletes the group, NOT the underlying responsibilities
   */
  @Delete(':id')
  @Roles('ADMIN', 'MANAGER')
  remove(
    @Param('id', ParseIntPipe) id: number,
    @Request() req,
  ) {
    return this.responsibilityGroupsService.remove(
      id,
      req.user.id,
      req.user.role,
      req.user.subDepartmentId,
    );
  }

  /**
   * Add responsibilities to a group
   * POST /responsibility-groups/:id/responsibilities
   */
  @Post(':id/responsibilities')
  @Roles('ADMIN', 'MANAGER')
  addResponsibilities(
    @Param('id', ParseIntPipe) id: number,
    @Body() addDto: AddResponsibilitiesToGroupDto,
    @Request() req,
  ) {
    return this.responsibilityGroupsService.addResponsibilities(
      id,
      addDto,
      req.user.id,
      req.user.role,
      req.user.subDepartmentId,
    );
  }

  /**
   * Remove a responsibility from a group
   * DELETE /responsibility-groups/:groupId/responsibilities/:responsibilityId
   * Note: This only removes the association, not the responsibility itself
   */
  @Delete(':groupId/responsibilities/:responsibilityId')
  @Roles('ADMIN', 'MANAGER')
  removeResponsibility(
    @Param('groupId', ParseIntPipe) groupId: number,
    @Param('responsibilityId', ParseIntPipe) responsibilityId: number,
    @Request() req,
  ) {
    return this.responsibilityGroupsService.removeResponsibilityFromGroup(
      groupId,
      responsibilityId,
      req.user.id,
      req.user.role,
      req.user.subDepartmentId,
    );
  }

  /**
   * Assign a group to staff members
   * POST /responsibility-groups/:id/assign
   * This creates individual ResponsibilityAssignment records for each
   * responsibility in the group using existing assignment logic
   */
  @Post(':id/assign')
  @Roles('ADMIN', 'MANAGER')
  assignToStaff(
    @Param('id', ParseIntPipe) id: number,
    @Body() assignDto: AssignGroupToStaffDto,
    @Request() req,
  ) {
    return this.responsibilityGroupsService.assignToStaff(
      id,
      assignDto,
      req.user.id,
      req.user.role,
      req.user.subDepartmentId,
    );
  }

  /**
   * Get all staff members assigned to a group
   * GET /responsibility-groups/:id/staff
   */
  @Get(':id/staff')
  @Roles('ADMIN', 'MANAGER')
  getAssignedStaff(
    @Param('id', ParseIntPipe) id: number,
    @Request() req,
  ) {
    return this.responsibilityGroupsService.getAssignedStaff(
      id,
      req.user.id,
      req.user.role,
      req.user.subDepartmentId,
    );
  }

  /**
   * Unassign a group from a staff member
   * DELETE /responsibility-groups/:groupId/staff/:staffId
   * Note: This removes the group assignment record but does NOT remove
   * the individual ResponsibilityAssignment records
   */
  @Delete(':groupId/staff/:staffId')
  @Roles('ADMIN', 'MANAGER')
  unassignFromStaff(
    @Param('groupId', ParseIntPipe) groupId: number,
    @Param('staffId', ParseIntPipe) staffId: number,
    @Request() req,
  ) {
    return this.responsibilityGroupsService.unassignFromStaff(
      groupId,
      staffId,
      req.user.id,
      req.user.role,
      req.user.subDepartmentId,
    );
  }
}
