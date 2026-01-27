import { Controller, Get, Post, Body, Patch, Param, Delete,Query,Ip, UseGuards, Request} from '@nestjs/common';
import { EmployeesService } from './employees.service';
import { Prisma } from '@prisma/client';
import { Throttle,SkipThrottle } from '@nestjs/throttler';
import { LoggerService } from '../logger/logger.service';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { ChangePasswordDto } from './dto/change-password.dto';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { use } from 'passport';


@Controller('employees')
@UseGuards(JwtAuthGuard,RolesGuard)
export class EmployeesController {
  constructor(private readonly employeesService: EmployeesService) {}
  private readonly logger = new LoggerService(EmployeesController.name);
//commented individual auth guards and added global auth guard
  @Post()
  // @UseGuards(JwtAuthGuard)
  @Roles('ADMIN')
  create(@Body() createEmployeeDto: Prisma.EmployeeCreateInput) {
    return this.employeesService.create(createEmployeeDto);
  }

  @Get()
  @Roles('ADMIN', 'MANAGER', 'STAFF')
  // @UseGuards(JwtAuthGuard)
  findAll(
    @Ip() ip: string,
    @Query('role') role: 'ADMIN' | 'MANAGER' | 'STAFF',
    @Request() req,
  ) {
    this.logger.log(`Request for All Employees\t${ip}`, EmployeesController.name);
    return this.employeesService.findAllScoped(
      req.user.id,
      req.user.role,
      req.user.subDepartmentId,
      role,
    );
  }

  @Get(':id')
  @Roles('ADMIN', 'MANAGER', 'STAFF')
  // @UseGuards(JwtAuthGuard)
  findOne(@Param('id') id: string) {
    return this.employeesService.findOne(+id);
  }

  @Patch(':id')
  @Roles('ADMIN')
  // @UseGuards(JwtAuthGuard)
  update(@Param('id') id: string, @Body() updateEmployeeDto: Prisma.EmployeeUpdateInput) {
    return this.employeesService.update(+id, updateEmployeeDto);
  }

  @Delete(':id')
  @Roles('ADMIN')
  // @UseGuards(JwtAuthGuard)
  remove(@Param('id') id: string) {
    return this.employeesService.remove(+id);
  }

  @Post('change-password')
  // @UseGuards(JwtAuthGuard)
  async changePassword(
    @Request() req,
    @Body() changePasswordDto: ChangePasswordDto
  ) {
    return this.employeesService.changePassword(
      req.user.id,  // Changed from req.employee.id to req.user.id
      changePasswordDto.currentPassword,
      changePasswordDto.newPassword
    );
  }

  @Post(':id/reset-password')
  @Roles('ADMIN')
  async resetPassword(
    @Param('id') id: string,
    @Body() body: { newPassword: string }
  ) {
    return this.employeesService.resetPassword(+id, body.newPassword);
  }
}
