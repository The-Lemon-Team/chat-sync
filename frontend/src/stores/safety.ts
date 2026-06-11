import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { outboundGuard } from '@/services/outbound-guard';
import type { ChatFork, OutboundAction } from '@/types';

export const useSafetyStore = defineStore('safety', () => {
  /** По умолчанию включён — ничего не уходит в Telegram без явного разрешения */
  const safeModeEnabled = ref(true);

  /** Временная разблокировка LIVE-отправки (сессионная) */
  const liveSendUnlocked = ref(false);

  const statusLabel = computed(() =>
    safeModeEnabled.value
      ? liveSendUnlocked.value
        ? 'Безопасный режим: LIVE разблокирован'
        : 'Безопасный режим: исходящие заблокированы'
      : 'Безопасный режим выключен',
  );

  function enableSafeMode() {
    safeModeEnabled.value = true;
    liveSendUnlocked.value = false;
  }

  function disableSafeMode() {
    safeModeEnabled.value = false;
    liveSendUnlocked.value = false;
  }

  function unlockLiveSend() {
    if (!safeModeEnabled.value) return;
    liveSendUnlocked.value = true;
  }

  function lockLiveSend() {
    liveSendUnlocked.value = false;
  }

  function checkOutbound(action: OutboundAction, chatFork: ChatFork) {
    return outboundGuard.evaluate(action, chatFork, {
      safeModeEnabled: safeModeEnabled.value,
      liveSendUnlocked: liveSendUnlocked.value,
    });
  }

  return {
    safeModeEnabled,
    liveSendUnlocked,
    statusLabel,
    enableSafeMode,
    disableSafeMode,
    unlockLiveSend,
    lockLiveSend,
    checkOutbound,
  };
});
