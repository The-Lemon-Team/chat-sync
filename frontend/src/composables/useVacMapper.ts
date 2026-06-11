import type { Message } from '@/types';

export interface VacMessage {
  _id: string;
  content: string;
  senderId: string;
  username: string;
  timestamp: string;
  date: string;
  saved: boolean;
  distributed: boolean;
  seen: boolean;
  disableActions: boolean;
  disableReactions: boolean;
}

const SYNC_LABELS: Record<string, string> = {
  SYNCED: '✓ TG + Offline',
  OFFLINE_ONLY: '○ Только Offline',
  PENDING: '⏳ Ожидает sync',
};

export function mapToVacMessage(message: Message, currentUserId = 'me'): VacMessage {
  const date = new Date(message.createdAt);
  const syncLabel = SYNC_LABELS[message.syncStatus] ?? message.syncStatus;

  return {
    _id: message.localId,
    content: `${message.text}\n\n— ${syncLabel}`,
    senderId: message.telegramMessageId ? 'tg' : currentUserId,
    username: message.syncStatus === 'SYNCED' ? 'Telegram' : 'Offline',
    timestamp: date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }),
    date: date.toLocaleDateString('ru-RU'),
    saved: message.syncStatus === 'SYNCED',
    distributed: message.syncStatus === 'SYNCED',
    seen: message.syncStatus === 'SYNCED',
    disableActions: true,
    disableReactions: true,
  };
}

export function mapMessagesToVac(messages: Message[]): VacMessage[] {
  return messages.map((m) => mapToVacMessage(m));
}
