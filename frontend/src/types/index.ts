export type ChatType = 'SAVED_MESSAGES' | 'GROUP' | 'CHANNEL' | 'OFFLINE_JOURNAL';

export type ChatSyncMode = 'LIVE' | 'SCHEDULED' | 'MANUAL' | 'OFFLINE_ONLY';

export type MessageSyncStatus = 'PENDING' | 'SYNCED' | 'OFFLINE_ONLY';

export type OutboundAction = 'send_telegram' | 'sync_pull' | 'sync_push';

export interface TelegramAccount {
  id: string;
  phone: string;
  isActive: boolean;
  isHub: boolean;
  parentId: string | null;
  createdAt: string;
}

export interface TelegramDialog {
  telegramChatId: string;
  title: string;
  type: ChatType;
  unreadCount: number;
}

export interface ChatFork {
  id: string;
  telegramChatId: string | null;
  title: string;
  type: ChatType;
  syncMode: ChatSyncMode;
  syncInterval: number | null;
  lastSyncedAt: string | null;
  accountId: string;
  createdAt: string;
  updatedAt: string;
}

export interface MediaFile {
  id: string;
  localPath: string;
  telegramFileId: string | null;
  mimeType: string | null;
  fileSize: string | null;
}

export interface Message {
  id: string;
  localId: string;
  telegramMessageId: string | null;
  text: string;
  syncStatus: MessageSyncStatus;
  chatForkId: string;
  createdAt: string;
  updatedAt: string;
  mediaFiles: MediaFile[];
}

export interface SyncProgress {
  chatForkId: string;
  status: 'started' | 'progress' | 'completed' | 'failed';
  fetched?: number;
  saved?: number;
  error?: string;
}

export interface SyncResult {
  chatForkId: string;
  fetched: number;
  saved: number;
  skipped: boolean;
  reason?: string;
}

export interface OutboundDecision {
  allowed: boolean;
  reason?: string;
  requiresConfirmation?: boolean;
}
