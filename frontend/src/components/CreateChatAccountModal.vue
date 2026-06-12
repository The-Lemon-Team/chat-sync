<script setup lang="ts">
import { ref, watch } from 'vue';
import { useAccountStore } from '@/stores/account';
import { useThemeStore } from '@/stores/theme';
import type { ChatAccountSource } from '@/types';

const emit = defineEmits<{ close: []; created: [id: string] }>();

const accountStore = useAccountStore();
const themeStore = useThemeStore();

const displayName = ref('');
const source = ref<ChatAccountSource>('CLEAN');
const selectedChatIds = ref<Set<string>>(new Set());
const search = ref('');
const loading = ref(false);
const loadingDialogs = ref(false);
const error = ref<string | null>(null);

watch(
  source,
  async (value) => {
    if (value !== 'HUB_CLONE' || !accountStore.hasHub) return;

    loadingDialogs.value = true;
    error.value = null;
    try {
      await accountStore.loadHubDialogs();
      selectedChatIds.value = new Set(
        accountStore.dialogs.map((d) => d.telegramChatId),
      );
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Не удалось загрузить чаты';
    } finally {
      loadingDialogs.value = false;
    }
  },
  { immediate: true },
);

const filteredDialogs = () => {
  const q = search.value.trim().toLowerCase();
  if (!q) return accountStore.dialogs;
  return accountStore.dialogs.filter((d) =>
    d.title.toLowerCase().includes(q),
  );
};

function toggleChat(id: string) {
  const next = new Set(selectedChatIds.value);
  if (next.has(id)) next.delete(id);
  else next.add(id);
  selectedChatIds.value = next;
}

function selectAll() {
  selectedChatIds.value = new Set(accountStore.dialogs.map((d) => d.telegramChatId));
}

function deselectAll() {
  selectedChatIds.value = new Set();
}

async function submit() {
  if (!displayName.value.trim()) return;
  if (source.value === 'HUB_CLONE' && selectedChatIds.value.size === 0) {
    error.value = 'Выберите хотя бы один чат для экспорта';
    return;
  }

  loading.value = true;
  error.value = null;
  try {
    const account = await accountStore.createChatAccount(
      displayName.value.trim(),
      source.value,
      source.value === 'HUB_CLONE'
        ? [...selectedChatIds.value]
        : undefined,
    );
    emit('created', account.id);
    emit('close');
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Не удалось создать аккаунт';
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <Teleport to="body">
    <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div
        class="flex max-h-[90vh] w-full max-w-lg flex-col rounded-xl border border-slate-800 bg-slate-900 shadow-xl"
        :class="!themeStore.nightMode && 'border-slate-200 bg-white'"
      >
        <div class="shrink-0 p-6 pb-0">
          <h2
            class="mb-4 text-lg font-semibold text-slate-100"
            :class="!themeStore.nightMode && 'text-slate-900'"
          >
            Новый Chat Account
          </h2>

          <form id="create-chat-form" class="space-y-4" @submit.prevent="submit">
            <div>
              <label class="mb-1 block text-xs text-slate-400">Название</label>
              <input
                v-model="displayName"
                type="text"
                required
                class="modal-input"
                placeholder="Мой журнал"
              />
            </div>

            <fieldset class="space-y-2">
              <legend class="mb-2 text-xs text-slate-400">Тип аккаунта</legend>

              <label
                class="flex cursor-pointer gap-3 rounded-lg border border-slate-700 p-3"
                :class="source === 'HUB_CLONE' && 'border-indigo-500 bg-indigo-950/30'"
              >
                <input v-model="source" type="radio" value="HUB_CLONE" class="mt-1" />
                <span>
                  <span class="block text-sm font-medium text-slate-200">Экспорт из Hub</span>
                  <span class="text-xs text-slate-400">
                    Выберите чаты для массового экспорта в новый Chat Account.
                  </span>
                </span>
              </label>

              <label
                class="flex cursor-pointer gap-3 rounded-lg border border-slate-700 p-3"
                :class="source === 'CLEAN' && 'border-indigo-500 bg-indigo-950/30'"
              >
                <input v-model="source" type="radio" value="CLEAN" class="mt-1" />
                <span>
                  <span class="block text-sm font-medium text-slate-200">Чистый аккаунт</span>
                  <span class="text-xs text-slate-400">
                    Пустое рабочее пространство без экспорта.
                  </span>
                </span>
              </label>
            </fieldset>
          </form>
        </div>

        <!-- Chat selection for HUB_CLONE -->
        <div
          v-if="source === 'HUB_CLONE' && accountStore.hasHub"
          class="flex min-h-0 flex-1 flex-col border-t border-slate-700"
        >
          <div class="shrink-0 space-y-2 px-6 py-3">
            <div class="flex items-center justify-between">
              <p class="text-xs font-medium text-slate-400">
                Чаты для экспорта ({{ selectedChatIds.size }} / {{ accountStore.dialogs.length }})
              </p>
              <div class="flex gap-2 text-xs">
                <button type="button" class="text-indigo-400 hover:underline" @click="selectAll">
                  Все
                </button>
                <button type="button" class="text-slate-400 hover:underline" @click="deselectAll">
                  Снять
                </button>
              </div>
            </div>
            <input
              v-model="search"
              type="search"
              placeholder="Поиск..."
              class="modal-input"
            />
          </div>

          <div class="min-h-0 flex-1 overflow-y-auto px-6">
            <p v-if="loadingDialogs" class="py-4 text-sm text-slate-400">
              Загрузка чатов Hub...
            </p>
            <p v-else-if="!filteredDialogs().length" class="py-4 text-sm text-slate-400">
              Нет доступных чатов
            </p>
            <label
              v-for="dialog in filteredDialogs()"
              :key="dialog.telegramChatId"
              class="flex cursor-pointer items-center gap-3 border-b border-slate-800 py-2.5 text-sm last:border-0"
            >
              <input
                type="checkbox"
                :checked="selectedChatIds.has(dialog.telegramChatId)"
                @change="toggleChat(dialog.telegramChatId)"
              />
              <span class="min-w-0 flex-1 truncate text-slate-200">{{ dialog.title }}</span>
              <span class="shrink-0 text-[10px] text-slate-500">{{ dialog.type }}</span>
            </label>
          </div>
        </div>

        <div class="shrink-0 space-y-3 p-6 pt-3">
          <p v-if="error" class="text-sm text-red-400">{{ error }}</p>

          <p
            v-if="source === 'HUB_CLONE' && !accountStore.hasHub"
            class="text-xs text-amber-400"
          >
            Сначала подключите Hub Telegram Account
          </p>

          <div class="flex gap-2">
            <button
              type="button"
              class="flex-1 rounded-lg border border-slate-700 py-2 text-sm text-slate-300"
              @click="emit('close')"
            >
              Отмена
            </button>
            <button
              type="submit"
              form="create-chat-form"
              class="flex-1 rounded-lg bg-indigo-600 py-2 text-sm font-medium text-white disabled:opacity-50"
              :disabled="
                loading
                || (source === 'HUB_CLONE' && (!accountStore.hasHub || loadingDialogs))
                || (source === 'HUB_CLONE' && selectedChatIds.size === 0)
              "
            >
              {{ loading ? 'Экспорт...' : 'Создать' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.modal-input {
  @apply w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 outline-none focus:border-indigo-500;
}

html:not(.dark) .modal-input {
  @apply border-slate-300 bg-white text-slate-900;
}
</style>
