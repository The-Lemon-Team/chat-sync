import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { TelegramAccountRole } from '@prisma/client';
import { Api } from 'telegram/tl';
import { utils } from 'telegram';
import { ChatType } from '@prisma/client';
import { mapAccountToPayload } from '../common/mappers/account.mapper';
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

  async listAllAccounts(userId: string) {
    const [accounts, hub] = await Promise.all([
      this.prisma.telegramAccount.findMany({
        where: { userId },
        orderBy: [{ role: 'asc' }, { createdAt: 'asc' }],
      }),
      this.prisma.telegramAccount.findFirst({
        where: { userId, role: TelegramAccountRole.HUB },
      }),
    ]);

    const hubActive = !!hub?.isActive;
    return accounts.map((a) => mapAccountToPayload(a, hubActive));
  }

  async listDialogs(hubAccountId: string): Promise<TelegramDialogDto[]> {
    const account = await this.prisma.telegramAccount.findUnique({
      where: { id: hubAccountId },
    });

    if (!account || account.role !== TelegramAccountRole.HUB) {
      throw new NotFoundException(`Hub account ${hubAccountId} not found`);
    }

    const client = this.telegramManager.getClient(hubAccountId);
    if (!client) {
      throw new BadRequestException(
        `Telegram client not connected for hub ${hubAccountId}`,
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
