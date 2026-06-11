import { Logger } from '@nestjs/common';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { MessagePayload } from '../common/mappers/message.mapper';
import { SyncProgressPayload } from './types/ws-events.interface';

@WebSocketGateway({
  cors: { origin: '*' },
  namespace: '/chat',
})
export class ChatGateway implements OnGatewayConnection {
  private readonly logger = new Logger(ChatGateway.name);

  @WebSocketServer()
  server!: Server;

  handleConnection(client: Socket) {
    this.logger.debug(`Client connected: ${client.id}`);
  }

  @SubscribeMessage('join')
  handleJoin(
    @ConnectedSocket() client: Socket,
    @MessageBody() chatForkId: string,
  ) {
    const room = this.forkRoom(chatForkId);
    client.join(room);
    this.logger.debug(`Client ${client.id} joined ${room}`);
    return { joined: chatForkId };
  }

  @SubscribeMessage('leave')
  handleLeave(
    @ConnectedSocket() client: Socket,
    @MessageBody() chatForkId: string,
  ) {
    const room = this.forkRoom(chatForkId);
    client.leave(room);
    return { left: chatForkId };
  }

  emitNewMessage(chatForkId: string, message: MessagePayload) {
    this.server.to(this.forkRoom(chatForkId)).emit('message:new', message);
  }

  emitMessageUpdated(chatForkId: string, message: MessagePayload) {
    this.server.to(this.forkRoom(chatForkId)).emit('message:updated', message);
  }

  emitSyncProgress(chatForkId: string, progress: SyncProgressPayload) {
    this.server.to(this.forkRoom(chatForkId)).emit('sync:progress', progress);
  }

  private forkRoom(chatForkId: string): string {
    return `fork:${chatForkId}`;
  }
}
