import {
  ChatAccountSource,
  TelegramAccount,
  TelegramAccountRole,
} from '@prisma/client';

export interface AccountCapabilities {
  canSearch: boolean;
  canSubscribe: boolean;
  canSyncFromHub: boolean;
}

export interface AccountPayload {
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

export function mapAccountToPayload(
  account: TelegramAccount,
  hubActive: boolean,
): AccountPayload {
  const hubLinked =
    account.role === TelegramAccountRole.CHAT &&
    account.source === ChatAccountSource.HUB_CLONE &&
    !account.hubDetachedAt &&
    hubActive;

  return {
    id: account.id,
    role: account.role,
    phone: account.phone,
    displayName: account.displayName,
    source: account.source,
    hubSourceId: account.hubSourceId,
    hubDetachedAt: account.hubDetachedAt?.toISOString() ?? null,
    isActive: account.isActive,
    createdAt: account.createdAt.toISOString(),
    capabilities: {
      canSearch:
        account.role === TelegramAccountRole.HUB && account.isActive,
      canSubscribe:
        account.role === TelegramAccountRole.HUB && account.isActive,
      canSyncFromHub: hubLinked,
    },
  };
}
