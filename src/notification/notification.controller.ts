import {
  Controller,
  Get,
  Patch,
  Param,
  Req,
  UseGuards,
  Post,
  Body,
  Delete,
} from '@nestjs/common';
import { NotificationService } from './notification.service';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { CreateBroadcastNoticeDto } from './dto/create-notification.dto';
import { UpdateNotificationDto } from './dto/update-notification.dto';

@Controller('notifications')
export class NotificationController {
  constructor(private readonly service: NotificationService) {}

  // 🔔 Get all notifications for current user
  @UseGuards(JwtAuthGuard)
  @Get()
  getMyNotifications(@Req() req: any) {
    return this.service.findAll(req.user.id);
  }

  // 🔔 Mark one as read
  @UseGuards(JwtAuthGuard)
  @Patch(':id/read')
  markAsRead(@Param('id') id: string) {
    return this.service.markAsRead(+id);
  }

  // 🔔 Mark all as read
  @UseGuards(JwtAuthGuard)
  @Patch('read-all')
  markAll(@Req() req: any) {
    return this.service.markAllAsRead(req.user.id);
  }

  // 🔔 Unread count
  @UseGuards(JwtAuthGuard)
  @Get('unread-count')
  getUnread(@Req() req: any) {
    return this.service.getUnreadCount(req.user.id);
  }

  // ==================== Notice Board Endpoints ====================

  // 📢 Create broadcast notice
  @UseGuards(JwtAuthGuard)
  @Post('broadcast')
  createBroadcast(@Req() req: any, @Body() dto: CreateBroadcastNoticeDto) {
    return this.service.createBroadcast(
      dto,
      req.user.id,
      req.user.role,
      req.user.subDepartmentId,
    );
  }

  // 📋 Get notices for manage view (admin/manager)
  @UseGuards(JwtAuthGuard)
  @Get('manage')
  getManageNotices(@Req() req: any) {
    return this.service.getManageNotices(
      req.user.id,
      req.user.role,
      req.user.departmentId || null,
      req.user.subDepartmentId || null,
    );
  }

  // 📌 Toggle pin
  @UseGuards(JwtAuthGuard)
  @Patch(':id/pin')
  togglePin(@Param('id') id: string, @Req() req: any) {
    return this.service.togglePin(+id, req.user.id, req.user.role);
  }

  // ✏️ Update notice content
  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  updateNotice(@Param('id') id: string, @Req() req: any, @Body() dto: UpdateNotificationDto) {
    return this.service.updateNotice(+id, dto, req.user.id, req.user.role);
  }

  // 🗑️ Delete notice
  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  deleteNotice(@Param('id') id: string, @Req() req: any) {
    return this.service.deleteNotice(+id, req.user.id, req.user.role);
  }

  // 🎯 Get targeting options
  @UseGuards(JwtAuthGuard)
  @Get('targets')
  getTargets(@Req() req: any) {
    return this.service.getTargets(req.user.role, req.user.subDepartmentId);
  }

  // 📰 Get notice board (staff view)
  @UseGuards(JwtAuthGuard)
  @Get('board')
  getNoticeBoard(@Req() req: any) {
    return this.service.getNoticeBoard(req.user.id);
  }

  // 🧪 TEST ONLY (remove later)
  @UseGuards(JwtAuthGuard)
  @Post('test')
  createTest(@Req() req: any) {
    return this.service.create({
      userId: req.user.id,
      title: 'Test Notification',
      message: 'This is a test notification',
      type: 'TEST',
    });
  }
}
