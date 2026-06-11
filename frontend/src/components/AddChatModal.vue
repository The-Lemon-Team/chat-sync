<script setup lang="ts">
import { ref, watch } from 'vue';
import { useAccountStore } from '@/stores/account';
import { useChatStore } from '@/stores/chat';
import type { ChatSyncMode } from '@/types';

const emit = defineEmits<{ close: [] }>();

const accountStore = useAccountStore();
const chatStore = useChatStore();

const search = ref('');
const syncMode = ref<ChatSyncMode>('MANUAL');
const adding = ref(false);
const localError = ref<string | null>(null);

watch(
  () => accountStore.selectedAccountId,
  (id) => {
    if (id) accountStore.loadDialogs(id);
  },
  { immediate: true },
);

const availableDialogs = () => {
  const q = search.value.trim().toLowerCase();
  return accountStore.dialogs.filter((d) => {
    if (chatStore.forkTelegramIds.has(d.telegramChatId)) return false;
    if (!q) return true;
    return d.title.toLowerCase().includes(q);
  });
};

async function addDialog(telegramChatId: string) {
  const dialog = accountStore.dialogs.find(
    (d) => d.telegramChatId === telegramChatId,
  );
  const accountId = accountStore.selectedAccountId;
  if (!dialog || !accountId) return;

  adding.value = true;
  localError.value = null;
  try {
    await chatStore.addSelectedChat(accountId, dialog, syncMode.value);
    emit('close');
  } catch (e) {
    localError.value = e instanceof Error ? e.message : 'Не удалось добавить чат';
  } finally {
    adding.value = false;
  }
}
</script>

<template>
  <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
    <div class="max-h-[80vh] w-full max-w-lg overflow-hidden rounded-xl bg-slate-900 shadow-xl">
      <div class="border-b border-slate-700 px-4 py-3">
        <h2 class="text-lg font-semibold">Добавить чат</h2>
        <p class="mt-1 text-xs text-slate-400">
          Выберите конкретный чат. Массовый импорт не выполняется.
        </p>
      </div>

      <div class="space-y-3 border-b border-slate-700 px-4 py-3">
        <input
          v-model="search"
          type="search"
          placeholder="Поиск..."
          class="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm outline-none focus:border-indigo-500"
        />
        <label class="flex items-center gap-2 text-sm text-slate-300">
          Режим sync:
          <select
            v-model="syncMode"
            class="rounded border border-slate-700 bg-slate-800 px-2 py-1 text-sm"
          >
            <option value="MANUAL">MANUAL — только по кнопке</option>
            <option value="OFFLINE_ONLY">OFFLINE_ONLY — без Telegram</option>
            <option value="SCHEDULED">SCHEDULED — по расписанию</option>
            <option value="LIVE">LIVE — мгновенно (осторожно!)</option>
          </select>
        </label>
      </div>

      <div class="max-h-80 overflow-y-auto">
        <p v-if="accountStore.loading" class="p-4 text-sm text-slate-400">
          Загрузка диалогов...
        </p>
        <p v-else-if="!availableDialogs().length" class="p-4 text-sm text-slate-400">
          Нет доступных чатов или все уже добавлены
        </p>
        <button
          v-for="dialog in availableDialogs()"
          :key="dialog.telegramChatId"
          type="button"
          class="flex w-full items-center justify-between border-b border-slate-800 px-4 py-3 text-left hover:bg-slate-800 disabled:opacity-50"
          :disabled="adding"
          @click="addDialog(dialog.telegramChatId)"
        >
          <span>
            <span class="font-medium">{{ dialog.title }}</span>
            <span class="ml-2 text-xs text-slate-500">{{ dialog.type }}</span>
          </span>
          <span class="text-xs text-indigo-400">+ добавить</span>
        </button>
      </div>

      <p v-if="localError || accountStore.error" class="px-4 py-2 text-sm text-red-400">
        {{ localError ?? accountStore.error }}
      </p>

      <div class="flex justify-end gap-2 border-t border-slate-700 px-4 py-3">
        <button
          type="button"
          class="rounded-lg px-4 py-2 text-sm text-slate-300 hover:bg-slate-800"
          @click="emit('close')"
        >
          Закрыть
        </button>
      </div>
    </div>
  </div>
</template>
