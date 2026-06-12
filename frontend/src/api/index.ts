import { apiFetch } from './client';
import type {
  AppAccount,
  AuthResponse,
  AuthStepResult,
  ChatAccountSource,
  ChatFork,
  ChatSyncMode,
  ChatType,
  Message,
  SyncResult,
  TelegramDialog,
  User,
} from '@/types';

export const userAuthApi = {
  register: (email: string, password: string, name?: string) =>
    apiFetch<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, name }),
    }),

  login: (email: string, password: string) =>
    apiFetch<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  me: () => apiFetch<User>('/auth/me'),
};

export const hubApi = {
  get: () => apiFetch<AppAccount | null>('/telegram/hub'),
  dialogs: () => apiFetch<TelegramDialog[]>('/telegram/hub/dialogs'),
};

export const chatAccountsApi = {
  list: () => apiFetch<AppAccount[]>('/chat-accounts'),

  create: (
    displayName: string,
    source: ChatAccountSource,
    telegramChatIds?: string[],
  ) =>
    apiFetch<AppAccount>('/chat-accounts', {
      method: 'POST',
      body: JSON.stringify({ displayName, source, telegramChatIds }),
    }),
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

export const telegramAuthApi = {
  start: (phone: string) =>
    apiFetch<AuthStepResult>('/telegram/auth/start', {
      method: 'POST',
      body: JSON.stringify({ phone }),
    }),

  submitCode: (phone: string, code: string) =>
    apiFetch<AuthStepResult>('/telegram/auth/code', {
      method: 'POST',
      body: JSON.stringify({ phone, code }),
    }),

  submitPassword: (phone: string, password: string) =>
    apiFetch<AuthStepResult>('/telegram/auth/password', {
      method: 'POST',
      body: JSON.stringify({ phone, password }),
    }),
};
