import { Logger, UnauthorizedException } from '@nestjs/common';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { AuthService } from '../auth/auth.service';
import { MessagePayload } from '../common/mappers/message.mapper';
import { OwnershipService } from '../common/ownership.service';
import { SyncProgressPayload } from './types/ws-events.interface';

@WebSocketGateway({
  cors: { origin: '*' },
  namespace: '/chat',
})
export class ChatGateway implements OnGatewayConnection {
  private readonly logger = new Logger(ChatGateway.name);

  @WebSocketServer()
  server!: Server;

  constructor(
    private readonly authService: AuthService,
    private readonly ownership: OwnershipService,
  ) {}

  handleConnection(client: Socket) {
    const token = this.extractToken(client);
    if (!token) {
      this.logger.warn(`Client ${client.id} rejected: no token`);
      client.disconnect();
      return;
    }

    const payload = this.authService.verifyToken(token);
    if (!payload) {
      this.logger.warn(`Client ${client.id} rejected: invalid token`);
      client.disconnect();
      return;
    }

    client.data.userId = payload.sub;
    this.logger.debug(`Client connected: ${client.id} (user ${payload.sub})`);
  }

  @SubscribeMessage('join')
  async handleJoin(
    @ConnectedSocket() client: Socket,
    @MessageBody() chatForkId: string,
  ) {
    const userId = client.data.userId as string | undefined;
    if (!userId) {
      throw new UnauthorizedException();
    }

    await this.ownership.assertForkOwnership(userId, chatForkId);

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

  private extractToken(client: Socket): string | null {
    const auth = client.handshake.auth as { token?: string } | undefined;
    if (auth?.token) return auth.token;

    const header = client.handshake.headers.authorization;
    if (header?.startsWith('Bearer ')) {
      return header.slice(7);
    }

    return null;
  }
}
