import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { chatAccountsApi, hubApi } from '@/api';
import { db } from '@/db/dexie';
import type { AppAccount, TelegramDialog } from '@/types';

export const useAccountStore = defineStore('account', () => {
  const hub = ref<AppAccount | null>(null);
  const chatAccounts = ref<AppAccount[]>([]);
  const dialogs = ref<TelegramDialog[]>([]);
  const selectedChatAccountId = ref<string | null>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);

  const selectedChatAccount = computed(() =>
    chatAccounts.value.find((a) => a.id === selectedChatAccountId.value),
  );

  const hasHub = computed(() => !!hub.value?.isActive);

  async function loadAccounts() {
    loading.value = true;
    error.value = null;
    try {
      const [hubAccount, chats] = await Promise.all([
        hubApi.get(),
        chatAccountsApi.list(),
      ]);

      hub.value = hubAccount;
      chatAccounts.value = chats;

      await db.accounts.bulkPut([
        ...(hubAccount ? [hubAccount] : []),
        ...chats,
      ]);

      if (
        !selectedChatAccountId.value ||
        !chats.some((a) => a.id === selectedChatAccountId.value)
      ) {
        selectedChatAccountId.value = chats[0]?.id ?? null;
      }
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to load accounts';
      const cached = await db.accounts.toArray();
      hub.value = cached.find((a) => a.role === 'HUB') ?? null;
      chatAccounts.value = cached.filter((a) => a.role === 'CHAT');
    } finally {
      loading.value = false;
    }
  }

  async function loadHubDialogs() {
    if (!hub.value) {
      dialogs.value = [];
      return;
    }

    loading.value = true;
    error.value = null;
    try {
      dialogs.value = await hubApi.dialogs();
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to load dialogs';
      dialogs.value = [];
    } finally {
      loading.value = false;
    }
  }

  async function createChatAccount(
    displayName: string,
    source: 'HUB_CLONE' | 'CLEAN',
    telegramChatIds?: string[],
  ) {
    const account = await chatAccountsApi.create(
      displayName,
      source,
      telegramChatIds,
    );
    chatAccounts.value = [...chatAccounts.value, account];
    await db.accounts.put(account);
    selectedChatAccountId.value = account.id;
    return account;
  }

  function selectChatAccount(id: string) {
    selectedChatAccountId.value = id;
  }

  function reset() {
    hub.value = null;
    chatAccounts.value = [];
    dialogs.value = [];
    selectedChatAccountId.value = null;
    loading.value = false;
    error.value = null;
  }

  return {
    hub,
    chatAccounts,
    dialogs,
    selectedChatAccountId,
    selectedChatAccount,
    hasHub,
    loading,
    error,
    loadAccounts,
    loadHubDialogs,
    createChatAccount,
    selectChatAccount,
    reset,
  };
});
