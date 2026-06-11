import { MediaFile, Message } from '@prisma/client';

export type MessageWithMedia = Message & { mediaFiles: MediaFile[] };

export interface MessagePayload {
  id: string;
  localId: string;
  telegramMessageId: string | null;
  text: string;
  syncStatus: string;
  chatForkId: string;
  createdAt: string;
  updatedAt: string;
  mediaFiles: Array<{
    id: string;
    localPath: string;
    telegramFileId: string | null;
    mimeType: string | null;
    fileSize: string | null;
  }>;
}

export function mapMessageToPayload(message: MessageWithMedia): MessagePayload {
  return {
    id: message.id,
    localId: message.localId,
    telegramMessageId: message.telegramMessageId?.toString() ?? null,
    text: message.text,
    syncStatus: message.syncStatus,
    chatForkId: message.chatForkId,
    createdAt: message.createdAt.toISOString(),
    updatedAt: message.updatedAt.toISOString(),
    mediaFiles: message.mediaFiles.map((file) => ({
      id: file.id,
      localPath: file.localPath,
      telegramFileId: file.telegramFileId,
      mimeType: file.mimeType,
      fileSize: file.fileSize?.toString() ?? null,
    })),
  };
}
