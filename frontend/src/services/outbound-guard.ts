import type {
  ChatFork,
  ChatSyncMode,
  OutboundAction,
  OutboundDecision,
} from '@/types';

/**
 * Центральный шлюз исходящих действий.
 * Любая отправка в Telegram или sync-push должна проходить через этот guard.
 */
export class OutboundGuard {
  evaluate(
    action: OutboundAction,
    chatFork: Pick<ChatFork, 'syncMode' | 'title'>,
    options: {
      safeModeEnabled: boolean;
      liveSendUnlocked: boolean;
    },
  ): OutboundDecision {
    if (action === 'sync_pull') {
      if (chatFork.syncMode === 'OFFLINE_ONLY') {
        return {
          allowed: false,
          reason: `«${chatFork.title}» в режиме OFFLINE_ONLY — загрузка из Telegram запрещена`,
        };
      }
      return { allowed: true };
    }

    if (action === 'send_telegram' || action === 'sync_push') {
      if (options.safeModeEnabled && !options.liveSendUnlocked) {
        return {
          allowed: false,
          reason: 'Безопасный режим: отправка в Telegram заблокирована',
          requiresConfirmation: true,
        };
      }

      if (chatFork.syncMode === 'OFFLINE_ONLY') {
        return {
          allowed: false,
          reason: `«${chatFork.title}» — только оффлайн, сообщение не уйдёт в Telegram`,
        };
      }

      if (chatFork.syncMode === 'MANUAL' && action === 'send_telegram') {
        return {
          allowed: false,
          reason: 'Режим MANUAL: сообщение сохранится локально, sync — по кнопке',
        };
      }

      if (chatFork.syncMode === 'SCHEDULED' && action === 'send_telegram') {
        return {
          allowed: false,
          reason: 'Режим SCHEDULED: сообщение будет отправлено по расписанию',
        };
      }

      if (chatFork.syncMode === 'LIVE' && options.safeModeEnabled) {
        return {
          allowed: false,
          reason: 'Безопасный режим активен — разблокируйте LIVE-отправку',
          requiresConfirmation: true,
        };
      }
    }

    return { allowed: true };
  }

  defaultSyncModeForNewFork(): ChatSyncMode {
    return 'MANUAL';
  }
}

export const outboundGuard = new OutboundGuard();
