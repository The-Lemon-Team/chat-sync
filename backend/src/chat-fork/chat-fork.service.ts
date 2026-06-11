import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { mapMessageToPayload } from '../common/mappers/message.mapper';
import { CreateChatForkDto } from './dto/create-chat-fork.dto';

@Injectable()
export class ChatForkService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(accountId?: string) {
    return this.prisma.chatFork.findMany({
      where: accountId ? { accountId } : undefined,
      orderBy: { updatedAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const fork = await this.prisma.chatFork.findUnique({ where: { id } });
    if (!fork) {
      throw new NotFoundException(`Chat fork ${id} not found`);
    }
    return fork;
  }

  create(dto: CreateChatForkDto) {
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

  async getMessages(chatForkId: string, limit = 50, cursor?: string) {
    await this.findOne(chatForkId);

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
