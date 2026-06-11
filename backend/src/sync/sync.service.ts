import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ChatSyncMode } from '@prisma/client';
import { Api } from 'telegram/tl';
import { TelegramClient } from 'telegram';
import * as fs from 'fs/promises';
import * as path from 'path';
import { ChatGateway } from '../chat/chat.gateway';
import {
  mapMessageToPayload,
  MessageWithMedia,
} from '../common/mappers/message.mapper';
import { PrismaService } from '../prisma/prisma.service';
import { TelegramManagerService } from '../telegram/telegram-manager.service';

export interface SyncResult {
  chatForkId: string;
  fetched: number;
  saved: number;
  skipped: boolean;
  reason?: string;
}

@Injectable()
export class SyncService {
  private readonly logger = new Logger(SyncService.name);
  private readonly mediaRoot: string;
  private readonly syncInProgress = new Set<string>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly telegramManager: TelegramManagerService,
    private readonly chatGateway: ChatGateway,
    private readonly config: ConfigService,
  ) {
    this.mediaRoot =
      this.config.get<string>('MEDIA_STORAGE_PATH') ??
      path.join(process.cwd(), 'storage', 'media');
  }

  async syncChatFork(chatForkId: string): Promise<SyncResult> {
    if (this.syncInProgress.has(chatForkId)) {
      throw new BadRequestException(
        `Sync already in progress for chat fork ${chatForkId}`,
      );
    }

    this.syncInProgress.add(chatForkId);
    this.emitProgress(chatForkId, { status: 'started' });

    try {
      return await this.runSync(chatForkId);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.emitProgress(chatForkId, { status: 'failed', error: message });
      throw error;
    } finally {
      this.syncInProgress.delete(chatForkId);
    }
  }

  async syncDueChatForks(): Promise<void> {
    const forks = await this.prisma.chatFork.findMany({
      where: {
        syncMode: ChatSyncMode.SCHEDULED,
        telegramChatId: { not: null },
      },
    });

    for (const fork of forks) {
      if (!fork.syncInterval) continue;
      if (!this.isDue(fork.lastSyncedAt, fork.syncInterval)) continue;

      try {
        await this.syncChatFork(fork.id);
      } catch (error) {
        this.logger.error(`Scheduled sync failed for ${fork.id}`, error);
      }
    }
  }

  private async runSync(chatForkId: string): Promise<SyncResult> {
    const chatFork = await this.prisma.chatFork.findUnique({
      where: { id: chatForkId },
      include: { account: true },
    });

    if (!chatFork) {
      throw new NotFoundException(`Chat fork ${chatForkId} not found`);
    }

    if (chatFork.syncMode === ChatSyncMode.OFFLINE_ONLY) {
      return {
        chatForkId,
        fetched: 0,
        saved: 0,
        skipped: true,
        reason: 'OFFLINE_ONLY',
      };
    }

    if (!chatFork.telegramChatId) {
      return {
        chatForkId,
        fetched: 0,
        saved: 0,
        skipped: true,
        reason: 'NO_TELEGRAM_CHAT_ID',
      };
    }

    const client = this.telegramManager.getClient(chatFork.accountId);
    if (!client) {
      throw new BadRequestException(
        `Telegram client not connected for account ${chatFork.accountId}`,
      );
    }

    const entity = await client.getEntity(chatFork.telegramChatId);
    const lastMessage = await this.prisma.message.findFirst({
      where: {
        chatForkId,
        telegramMessageId: { not: null },
      },
      orderBy: { telegramMessageId: 'desc' },
    });

    let fetched = 0;
    let saved = 0;

    if (lastMessage?.telegramMessageId) {
      let minId = Number(lastMessage.telegramMessageId);

      while (true) {
        const batch = await client.getMessages(entity, { limit: 100, minId });
        if (!batch.length) break;

        fetched += batch.length;
        saved += await this.processBatch(client, chatForkId, batch);
        this.emitProgress(chatForkId, { status: 'progress', fetched, saved });

        minId = batch[batch.length - 1].id;
        if (batch.length < 100) break;
      }
    } else {
      let offsetId = 0;

      while (true) {
        const batch = await client.getMessages(entity, {
          limit: 100,
          offsetId: offsetId || undefined,
        });
        if (!batch.length) break;

        fetched += batch.length;
        saved += await this.processBatch(client, chatForkId, batch);
        this.emitProgress(chatForkId, { status: 'progress', fetched, saved });

        offsetId = batch[batch.length - 1].id;
        if (batch.length < 100) break;
      }
    }

    await this.prisma.chatFork.update({
      where: { id: chatForkId },
      data: { lastSyncedAt: new Date() },
    });

    this.emitProgress(chatForkId, {
      status: 'completed',
      fetched,
      saved,
    });

    this.logger.log(
      `Sync completed for ${chatForkId}: fetched=${fetched}, saved=${saved}`,
    );

    return { chatForkId, fetched, saved, skipped: false };
  }

  private async processBatch(
    client: TelegramClient,
    chatForkId: string,
    batch: Api.TypeMessage[],
  ): Promise<number> {
    let saved = 0;

    for (const raw of batch) {
      if (!(raw instanceof Api.Message)) continue;

      const savedMessage = await this.persistMessage(client, chatForkId, raw);
      if (savedMessage) {
        saved += 1;
        this.chatGateway.emitNewMessage(
          chatForkId,
          mapMessageToPayload(savedMessage),
        );
      }
    }

    return saved;
  }

  private async persistMessage(
    client: TelegramClient,
    chatForkId: string,
    tgMessage: Api.Message,
  ): Promise<MessageWithMedia | null> {
    const text = tgMessage.message ?? '';
    const telegramMessageId = BigInt(tgMessage.id);

    const existing = await this.prisma.message.findUnique({
      where: {
        chatForkId_telegramMessageId: { chatForkId, telegramMessageId },
      },
      include: { mediaFiles: true },
    });

    if (existing) {
      let updated = existing;

      if (existing.text !== text) {
        updated = await this.prisma.message.update({
          where: { id: existing.id },
          data: { text, syncStatus: 'SYNCED' },
          include: { mediaFiles: true },
        });
      }

      if (tgMessage.media && updated.mediaFiles.length === 0) {
        await this.downloadMedia(client, chatForkId, tgMessage, updated.id);
        return this.prisma.message.findUniqueOrThrow({
          where: { id: updated.id },
          include: { mediaFiles: true },
        });
      }

      return existing.text !== text ? updated : null;
    }

    const message = await this.prisma.message.create({
      data: {
        chatForkId,
        telegramMessageId,
        text,
        syncStatus: 'SYNCED',
      },
      include: { mediaFiles: true },
    });

    if (tgMessage.media) {
      await this.downloadMedia(client, chatForkId, tgMessage, message.id);
      return this.prisma.message.findUniqueOrThrow({
        where: { id: message.id },
        include: { mediaFiles: true },
      });
    }

    return message;
  }

  private async downloadMedia(
    client: TelegramClient,
    chatForkId: string,
    tgMessage: Api.Message,
    messageId: string,
  ) {
    const dir = path.join(
      this.mediaRoot,
      chatForkId,
      String(tgMessage.id),
    );
    await fs.mkdir(dir, { recursive: true });

    const extension = this.guessExtension(tgMessage);
    const localPath = path.join(dir, `file${extension}`);

    await client.downloadMedia(tgMessage, { outputFile: localPath });

    const stats = await fs.stat(localPath).catch(() => null);

    await this.prisma.mediaFile.create({
      data: {
        messageId,
        localPath,
        telegramFileId: this.extractFileId(tgMessage),
        mimeType: this.extractMimeType(tgMessage),
        fileSize: stats ? BigInt(stats.size) : null,
      },
    });
  }

  private extractFileId(message: Api.Message): string | null {
    const media = message.media;
    if (!media) return null;

    if (media instanceof Api.MessageMediaPhoto && media.photo) {
      const photo = media.photo as Api.Photo;
      return `${photo.id}_${photo.accessHash}`;
    }

    if (media instanceof Api.MessageMediaDocument && media.document) {
      const doc = media.document as Api.Document;
      return `${doc.id}_${doc.accessHash}`;
    }

    return null;
  }

  private extractMimeType(message: Api.Message): string | null {
    const media = message.media;
    if (media instanceof Api.MessageMediaDocument && media.document) {
      const doc = media.document as Api.Document;
      const mimeAttr = doc.attributes?.find(
        (attr) => attr instanceof Api.DocumentAttributeFilename,
      );
      if (mimeAttr instanceof Api.DocumentAttributeFilename) {
        const ext = path.extname(mimeAttr.fileName).toLowerCase();
        if (ext === '.jpg' || ext === '.jpeg') return 'image/jpeg';
        if (ext === '.png') return 'image/png';
        if (ext === '.mp4') return 'video/mp4';
        if (ext === '.pdf') return 'application/pdf';
      }
      return doc.mimeType ?? null;
    }

    if (media instanceof Api.MessageMediaPhoto) {
      return 'image/jpeg';
    }

    return null;
  }

  private guessExtension(message: Api.Message): string {
    const mime = this.extractMimeType(message);
    if (!mime) return '';

    const map: Record<string, string> = {
      'image/jpeg': '.jpg',
      'image/png': '.png',
      'video/mp4': '.mp4',
      'application/pdf': '.pdf',
    };

    return map[mime] ?? '';
  }

  private isDue(lastSyncedAt: Date | null, intervalMinutes: number): boolean {
    if (!lastSyncedAt) return true;
    const elapsed = Date.now() - lastSyncedAt.getTime();
    return elapsed >= intervalMinutes * 60 * 1000;
  }

  private emitProgress(
    chatForkId: string,
    data: Omit<import('../chat/types/ws-events.interface').SyncProgressPayload, 'chatForkId'>,
  ) {
    this.chatGateway.emitSyncProgress(chatForkId, { chatForkId, ...data });
  }
}
