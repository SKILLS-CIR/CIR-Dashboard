import {
  Controller,
  Get,
  Patch,
  Param,
  Req,
  UseGuards,
  Post,
} from '@nestjs/common';
import { NotificationService } from './notification.service';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';

@Controller('notifications')
export class NotificationController {
  constructor(private readonly service: NotificationService) {}

  // 🔔 Get all notifications
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
