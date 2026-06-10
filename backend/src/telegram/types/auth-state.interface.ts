import { TelegramClient } from 'telegram';

export interface PendingAuthState {
  client: TelegramClient;
  phone: string;
  phoneCodeHash: string;
  isHub: boolean;
  parentId?: string;
}

export type AuthStepResult =
  | { step: 'code_sent'; phone: string }
  | { step: 'password_required'; phone: string }
  | { step: 'authorized'; accountId: string; phone: string; isHub: boolean };
