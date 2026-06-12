import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { mapMessageToPayload } from '../common/mappers/message.mapper';
import { OwnershipService } from '../common/ownership.service';
import { CreateChatForkDto } from './dto/create-chat-fork.dto';

@Injectable()
export class ChatForkService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ownership: OwnershipService,
  ) {}

  findAll(userId: string, accountId?: string) {
    return this.prisma.chatFork.findMany({
      where: {
        account: {
          userId,
          ...(accountId && { id: accountId }),
        },
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async findOne(userId: string, id: string) {
    const fork = await this.prisma.chatFork.findFirst({
      where: { id, account: { userId } },
    });
    if (!fork) {
      throw new NotFoundException(`Chat fork ${id} not found`);
    }
    return fork;
  }

  async create(userId: string, dto: CreateChatForkDto) {
    await this.ownership.assertChatAccountOwnership(userId, dto.accountId);

    return this.prisma.chatFork.create({
      data: {
        accountId: dto.accountId,
        title: dto.title,
        type: dto.type,
        telegramChatId: dto.telegramChatId ?? null,
        syncMode: dto.syncMode,
        syncInterval: dto.syncInterval,
      },
    });
  }

  async getMessages(
    userId: string,
    chatForkId: string,
    limit = 50,
    cursor?: string,
  ) {
    await this.findOne(userId, chatForkId);

    const messages = await this.prisma.message.findMany({
      where: { chatForkId },
      include: { mediaFiles: true },
      orderBy: { createdAt: 'desc' },
      take: limit,
      ...(cursor && {
        cursor: { id: cursor },
        skip: 1,
      }),
    });

    return messages.map(mapMessageToPayload);
  }
}
