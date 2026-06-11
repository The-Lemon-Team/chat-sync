import Dexie, { type EntityTable } from 'dexie';
import type { ChatFork, Message, TelegramAccount } from '@/types';

class ChatSyncDatabase extends Dexie {
  accounts!: EntityTable<TelegramAccount, 'id'>;
  chatForks!: EntityTable<ChatFork, 'id'>;
  messages!: EntityTable<Message, 'id'>;

  constructor() {
    super('ChatSyncDB');

    this.version(1).stores({
      accounts: 'id, phone, isHub',
      chatForks: 'id, accountId, telegramChatId, syncMode, updatedAt',
      messages: 'id, chatForkId, localId, syncStatus, createdAt, [chatForkId+createdAt]',
    });
  }
}

export const db = new ChatSyncDatabase();
