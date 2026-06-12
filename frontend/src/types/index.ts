export type ChatType = 'SAVED_MESSAGES' | 'GROUP' | 'CHANNEL' | 'OFFLINE_JOURNAL';

export type ChatSyncMode = 'LIVE' | 'SCHEDULED' | 'MANUAL' | 'OFFLINE_ONLY';

export type MessageSyncStatus = 'PENDING' | 'SYNCED' | 'OFFLINE_ONLY';

export type OutboundAction = 'send_telegram' | 'sync_pull' | 'sync_push';

export type TelegramAccountRole = 'HUB' | 'CHAT';

export type ChatAccountSource = 'HUB_CLONE' | 'CLEAN';

export interface AccountCapabilities {
  canSearch: boolean;
  canSubscribe: boolean;
  canSyncFromHub: boolean;
}

export interface User {
  id: string;
  email: string;
  name: string | null;
  createdAt?: string;
}

export interface AuthResponse {
  accessToken: string;
  user: User;
}

export type AuthStepResult =
  | { step: 'code_sent'; phone: string }
  | { step: 'password_required'; phone: string }
  | { step: 'authorized'; accountId: string; phone: string; role: 'HUB' };

export interface AppAccount {
  id: string;
  role: TelegramAccountRole;
  phone: string | null;
  displayName: string | null;
  source: ChatAccountSource | null;
  hubSourceId: string | null;
  hubDetachedAt: string | null;
  isActive: boolean;
  createdAt: string;
  capabilities: AccountCapabilities;
}

/** @deprecated use AppAccount */
export type TelegramAccount = AppAccount;

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
