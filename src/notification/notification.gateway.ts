import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class NotificationGateway implements OnGatewayConnection {
  @WebSocketServer()
  server: Server;

  handleConnection(client: Socket) {
    console.log('Client connected:', client.id);
  }

  // User joins their own room
  @SubscribeMessage('join')
  handleJoin(client: Socket, userId: number) {
    client.join(`user-${userId}`);
  }

  // Send notification instantly
  sendNotification(userId: number, data: any) {
    this.server.to(`user-${userId}`).emit('notification', data);
  }
}
