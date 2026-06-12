import {
  BadRequestException,
  Injectable,
} from '@nestjs/common';
import {
  ChatAccountSource,
  ChatSyncMode,
  ChatType,
  Prisma,
  TelegramAccountRole,
} from '@prisma/client';
import { mapAccountToPayload } from '../common/mappers/account.mapper';
import { PrismaService } from '../prisma/prisma.service';
import { TelegramDialogService } from '../telegram/telegram-dialog.service';
import { CreateChatAccountDto } from './dto/create-chat-account.dto';

@Injectable()
export class ChatAccountService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly dialogService: TelegramDialogService,
  ) {}

  async list(userId: string) {
    const [accounts, hub] = await Promise.all([
      this.prisma.telegramAccount.findMany({
        where: { userId, role: TelegramAccountRole.CHAT },
        orderBy: { createdAt: 'asc' },
      }),
      this.findHub(userId),
    ]);

    const hubActive = !!hub?.isActive;
    return accounts.map((a) => mapAccountToPayload(a, hubActive));
  }

  async create(userId: string, dto: CreateChatAccountDto) {
    if (dto.source === ChatAccountSource.HUB_CLONE) {
      if (!dto.telegramChatIds?.length) {
        throw new BadRequestException(
          'telegramChatIds is required for HUB_CLONE export',
        );
      }
      return this.createFromHubExport(
        userId,
        dto.displayName,
        [...new Set(dto.telegramChatIds)],
      );
    }
    return this.createClean(userId, dto.displayName);
  }

  async createClean(userId: string, displayName: string) {
    const account = await this.prisma.telegramAccount.create({
      data: {
        role: TelegramAccountRole.CHAT,
        displayName,
        source: ChatAccountSource.CLEAN,
        userId,
      },
    });

    const hub = await this.findHub(userId);
    return mapAccountToPayload(account, !!hub?.isActive);
  }

  async createFromHubExport(
    userId: string,
    displayName: string,
    telegramChatIds: string[],
  ) {
    const hub = await this.getHubOrThrow(userId);
    const dialogs = await this.dialogService.listDialogs(hub.id);
    const dialogMap = new Map(
      dialogs.map((d) => [d.telegramChatId, d]),
    );

    const unknownIds = telegramChatIds.filter((id) => !dialogMap.has(id));
    if (unknownIds.length) {
      throw new BadRequestException(
        `Unknown chat ids: ${unknownIds.join(', ')}`,
      );
    }

    const chatAccount = await this.prisma.$transaction(async (tx) => {
      const created = await tx.telegramAccount.create({
        data: {
          role: TelegramAccountRole.CHAT,
          displayName,
          source: ChatAccountSource.HUB_CLONE,
          hubSourceId: hub.id,
          userId,
        },
      });

      const hubForks = await tx.chatFork.findMany({
        where: {
          accountId: hub.id,
          telegramChatId: { in: telegramChatIds },
        },
        include: {
          messages: { include: { mediaFiles: true } },
        },
      });

      const hubForkMap = new Map(
        hubForks
          .filter((f) => f.telegramChatId)
          .map((f) => [f.telegramChatId!, f]),
      );

      for (const chatId of telegramChatIds) {
        const dialog = dialogMap.get(chatId)!;
        const hubFork = hubForkMap.get(chatId);

        if (hubFork) {
          await this.cloneFork(tx, created.id, hubFork);
        } else {
          await tx.chatFork.create({
            data: {
              accountId: created.id,
              telegramChatId: chatId,
              title: dialog.title,
              type: dialog.type as ChatType,
              syncMode: ChatSyncMode.OFFLINE_ONLY,
            },
          });
        }
      }

      return created;
    });

    return mapAccountToPayload(chatAccount, hub.isActive);
  }

  private async cloneFork(
    tx: Prisma.TransactionClient,
    targetAccountId: string,
    fork: Prisma.ChatForkGetPayload<{
      include: { messages: { include: { mediaFiles: true } } };
    }>,
  ) {
    const newFork = await tx.chatFork.create({
      data: {
        accountId: targetAccountId,
        telegramChatId: fork.telegramChatId,
        title: fork.title,
        type: fork.type,
        syncMode: ChatSyncMode.OFFLINE_ONLY,
        syncInterval: fork.syncInterval,
        lastSyncedAt: fork.lastSyncedAt,
      },
    });

    for (const message of fork.messages) {
      const newMessage = await tx.message.create({
        data: {
          chatForkId: newFork.id,
          localId: message.localId,
          telegramMessageId: message.telegramMessageId,
          text: message.text,
          syncStatus: message.syncStatus,
          createdAt: message.createdAt,
        },
      });

      if (message.mediaFiles.length) {
        await tx.mediaFile.createMany({
          data: message.mediaFiles.map((file) => ({
            messageId: newMessage.id,
            localPath: file.localPath,
            telegramFileId: file.telegramFileId,
            mimeType: file.mimeType,
            fileSize: file.fileSize,
          })),
        });
      }
    }
  }

  private async getHubOrThrow(userId: string) {
    const hub = await this.findHub(userId);
    if (!hub) {
      throw new BadRequestException(
        'Hub Telegram Account is required for mass export',
      );
    }
    return hub;
  }

  private findHub(userId: string) {
    return this.prisma.telegramAccount.findFirst({
      where: { userId, role: TelegramAccountRole.HUB },
    });
  }
}
