import { apiFetch } from './client';
import type {
  ChatFork,
  ChatSyncMode,
  ChatType,
  Message,
  SyncResult,
  TelegramAccount,
  TelegramDialog,
} from '@/types';

export const accountsApi = {
  list: () => apiFetch<TelegramAccount[]>('/telegram/accounts'),
  dialogs: (accountId: string) =>
    apiFetch<TelegramDialog[]>(`/telegram/accounts/${accountId}/dialogs`),
};

export const chatForksApi = {
  list: (accountId?: string) => {
    const query = accountId ? `?accountId=${accountId}` : '';
    return apiFetch<ChatFork[]>(`/chat-forks${query}`);
  },

  create: (payload: {
    accountId: string;
    title: string;
    type: ChatType;
    telegramChatId?: string;
    syncMode?: ChatSyncMode;
    syncInterval?: number;
  }) =>
    apiFetch<ChatFork>('/chat-forks', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  messages: (forkId: string, limit = 50) =>
    apiFetch<Message[]>(`/chat-forks/${forkId}/messages?limit=${limit}`),

  sync: (forkId: string) =>
    apiFetch<SyncResult>(`/chat-forks/${forkId}/sync`, { method: 'POST' }),
};

export const authApi = {
  start: (phone: string, isHub = true) =>
    apiFetch('/telegram/auth/start', {
      method: 'POST',
      body: JSON.stringify({ phone, isHub }),
    }),
};
