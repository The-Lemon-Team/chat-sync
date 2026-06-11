import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { chatForksApi } from '@/api';
import { db } from '@/db/dexie';
import { outboundGuard } from '@/services/outbound-guard';
import {
  joinForkRoom,
  leaveForkRoom,
  onNewMessage,
  onSyncProgress,
} from '@/services/socket';
import { useSafetyStore } from './safety';
import type { ChatFork, ChatSyncMode, ChatType, Message, SyncProgress, TelegramDialog } from '@/types';

export const useChatStore = defineStore('chat', () => {
  const forks = ref<ChatFork[]>([]);
  const messages = ref<Message[]>([]);
  const activeForkId = ref<string | null>(null);
  const syncProgress = ref<SyncProgress | null>(null);
  const loading = ref(false);
  const syncing = ref(false);
  const error = ref<string | null>(null);

  let unsubscribeMessage: (() => void) | null = null;
  let unsubscribeSync: (() => void) | null = null;

  const activeFork = computed(() =>
    forks.value.find((f) => f.id === activeForkId.value) ?? null,
  );

  const forkTelegramIds = computed(
    () => new Set(forks.value.map((f) => f.telegramChatId).filter(Boolean)),
  );

  async function loadForks(accountId?: string) {
    loading.value = true;
    error.value = null;
    try {
      const remote = await chatForksApi.list(accountId);
      forks.value = remote;
      await db.chatForks.bulkPut(remote);
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to load forks';
      forks.value = accountId
        ? await db.chatForks.where('accountId').equals(accountId).toArray()
        : await db.chatForks.toArray();
    } finally {
      loading.value = false;
    }
  }

  /**
   * Пользователь вручную добавляет конкретный чат — без массового импорта.
   */
  async function addSelectedChat(
    accountId: string,
    dialog: TelegramDialog,
    syncMode?: ChatSyncMode,
  ) {
    if (forkTelegramIds.value.has(dialog.telegramChatId)) {
      throw new Error('Этот чат уже добавлен');
    }

    const fork = await chatForksApi.create({
      accountId,
      title: dialog.title,
      type: dialog.type,
      telegramChatId: dialog.telegramChatId,
      syncMode: syncMode ?? outboundGuard.defaultSyncModeForNewFork(),
    });

    forks.value = [fork, ...forks.value];
    await db.chatForks.put(fork);
    return fork;
  }

  async function selectFork(forkId: string) {
    if (activeForkId.value) {
      leaveForkRoom(activeForkId.value);
    }

    activeForkId.value = forkId;
    joinForkRoom(forkId);

    loading.value = true;
    error.value = null;
    try {
      const cached = await db.messages
        .where('chatForkId')
        .equals(forkId)
        .reverse()
        .sortBy('createdAt');

      messages.value = cached.reverse();

      const remote = await chatForksApi.messages(forkId);
      messages.value = remote;
      await db.messages.bulkPut(remote);
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to load messages';
    } finally {
      loading.value = false;
    }
  }

  async function triggerSync(forkId: string) {
    const fork = forks.value.find((f) => f.id === forkId);
    if (!fork) return;

    const safety = useSafetyStore();
    const decision = safety.checkOutbound('sync_pull', fork);
    if (!decision.allowed) {
      error.value = decision.reason ?? 'Sync blocked';
      return;
    }

    syncing.value = true;
    error.value = null;
    try {
      await chatForksApi.sync(forkId);
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Sync failed';
    } finally {
      syncing.value = false;
    }
  }

  /**
   * Отправка сообщения (заглушка — сохраняет локально, в TG не уходит без разрешения).
   */
  async function sendMessage(text: string) {
    const fork = activeFork.value;
    if (!fork) return;

    const safety = useSafetyStore();
    const decision = safety.checkOutbound('send_telegram', fork);

    const localMessage: Message = {
      id: crypto.randomUUID(),
      localId: crypto.randomUUID(),
      telegramMessageId: null,
      text,
      syncStatus: decision.allowed ? 'PENDING' : 'OFFLINE_ONLY',
      chatForkId: fork.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      mediaFiles: [],
    };

    messages.value = [...messages.value, localMessage];
    await db.messages.put(localMessage);

    if (!decision.allowed) {
      error.value = decision.reason ?? 'Сообщение сохранено только оффлайн';
    }

    // TODO: POST /messages when backend endpoint is ready
    return { message: localMessage, decision };
  }

  function initSocketListeners() {
    unsubscribeMessage?.();
    unsubscribeSync?.();

    unsubscribeMessage = onNewMessage(async (message) => {
      if (message.chatForkId !== activeForkId.value) return;
      messages.value = [...messages.value.filter((m) => m.id !== message.id), message];
      await db.messages.put(message);
    });

    unsubscribeSync = onSyncProgress((progress) => {
      syncProgress.value = progress;
    });
  }

  function cleanup() {
    if (activeForkId.value) leaveForkRoom(activeForkId.value);
    unsubscribeMessage?.();
    unsubscribeSync?.();
  }

  return {
    forks,
    messages,
    activeForkId,
    activeFork,
    syncProgress,
    loading,
    syncing,
    error,
    forkTelegramIds,
    loadForks,
    addSelectedChat,
    selectFork,
    triggerSync,
    sendMessage,
    initSocketListeners,
    cleanup,
  };
});
