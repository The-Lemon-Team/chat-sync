import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { accountsApi } from '@/api';
import { db } from '@/db/dexie';
import type { TelegramAccount, TelegramDialog } from '@/types';

export const useAccountStore = defineStore('account', () => {
  const accounts = ref<TelegramAccount[]>([]);
  const dialogs = ref<TelegramDialog[]>([]);
  const selectedAccountId = ref<string | null>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);

  const hubAccount = computed(() => accounts.value.find((a) => a.isHub));
  const selectedAccount = computed(() =>
    accounts.value.find((a) => a.id === selectedAccountId.value),
  );

  async function loadAccounts() {
    loading.value = true;
    error.value = null;
    try {
      const remote = await accountsApi.list();
      accounts.value = remote;
      await db.accounts.bulkPut(remote);

      if (!selectedAccountId.value && remote.length) {
        const hub = remote.find((a) => a.isHub) ?? remote[0];
        selectedAccountId.value = hub.id;
      }
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to load accounts';
      accounts.value = await db.accounts.toArray();
    } finally {
      loading.value = false;
    }
  }

  async function loadDialogs(accountId: string) {
    loading.value = true;
    error.value = null;
    try {
      dialogs.value = await accountsApi.dialogs(accountId);
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to load dialogs';
      dialogs.value = [];
    } finally {
      loading.value = false;
    }
  }

  function selectAccount(id: string) {
    selectedAccountId.value = id;
  }

  return {
    accounts,
    dialogs,
    selectedAccountId,
    selectedAccount,
    hubAccount,
    loading,
    error,
    loadAccounts,
    loadDialogs,
    selectAccount,
  };
});
