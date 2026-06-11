import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Api } from 'telegram/tl';
import { utils } from 'telegram';
import { ChatType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { TelegramManagerService } from './telegram-manager.service';

export interface TelegramDialogDto {
  telegramChatId: string;
  title: string;
  type: ChatType;
  unreadCount: number;
}

@Injectable()
export class TelegramDialogService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly telegramManager: TelegramManagerService,
  ) {}

  listAccounts() {
    return this.prisma.telegramAccount.findMany({
      select: {
        id: true,
        phone: true,
        isActive: true,
        isHub: true,
        parentId: true,
        createdAt: true,
      },
      orderBy: [{ isHub: 'desc' }, { createdAt: 'asc' }],
    });
  }

  async listDialogs(accountId: string): Promise<TelegramDialogDto[]> {
    const account = await this.prisma.telegramAccount.findUnique({
      where: { id: accountId },
    });

    if (!account) {
      throw new NotFoundException(`Account ${accountId} not found`);
    }

    const client = this.telegramManager.getClient(accountId);
    if (!client) {
      throw new BadRequestException(
        `Telegram client not connected for account ${accountId}`,
      );
    }

    const dialogs = await client.getDialogs({ limit: 200 });

    return dialogs
      .filter((dialog) => dialog.entity)
      .map((dialog) => {
        const entity = dialog.entity!;
        const telegramChatId = String(utils.getPeerId(entity));

        return {
          telegramChatId,
          title: dialog.title ?? dialog.name ?? telegramChatId,
          type: this.mapEntityType(entity),
          unreadCount: dialog.unreadCount ?? 0,
        };
      });
  }

  private mapEntityType(entity: Api.TypeUser | Api.TypeChat): ChatType {
    if (entity instanceof Api.User) {
      if (entity.self) return ChatType.SAVED_MESSAGES;
      return ChatType.GROUP;
    }

    if (entity instanceof Api.Channel) {
      return entity.megagroup ? ChatType.GROUP : ChatType.CHANNEL;
    }

    if (entity instanceof Api.Chat) {
      return ChatType.GROUP;
    }

    return ChatType.GROUP;
  }
}
