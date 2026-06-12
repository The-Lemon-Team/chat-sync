<script setup lang="ts">
import { ref } from 'vue';
import { useChatStore } from '@/stores/chat';
import { useUiStore } from '@/stores/ui';
import { useThemeStore } from '@/stores/theme';
import AddChatModal from './AddChatModal.vue';
import BurgerButton from './BurgerButton.vue';

const chatStore = useChatStore();
const themeStore = useThemeStore();
const uiStore = useUiStore();

const showAddModal = ref(false);
</script>

<template>
  <aside
    class="flex w-72 shrink-0 flex-col border-r border-slate-800 bg-slate-900 dark:border-slate-800 dark:bg-slate-900"
    :class="!themeStore.nightMode && 'border-slate-200 bg-white'"
  >
    <div
      class="flex items-center gap-2 border-b border-slate-800 px-3 py-3 dark:border-slate-800"
      :class="!themeStore.nightMode && 'border-slate-200'"
    >
      <BurgerButton @click="uiStore.openMenu()" />
      <h1
        class="min-w-0 flex-1 truncate text-sm font-semibold tracking-wide text-slate-200"
        :class="!themeStore.nightMode && 'text-slate-800'"
      >
        Chat-Sync
      </h1>
      <button
        type="button"
        class="rounded bg-indigo-600 px-2 py-1 text-xs font-medium hover:bg-indigo-500"
        @click="showAddModal = true"
      >
        + Чат
      </button>
    </div>

    <div class="flex-1 overflow-y-auto">
      <p
        v-if="chatStore.loading && !chatStore.forks.length"
        class="p-4 text-sm text-slate-500"
        :class="!themeStore.nightMode && 'text-slate-400'"
      >
        Загрузка...
      </p>
      <p
        v-else-if="!chatStore.forks.length"
        class="p-4 text-sm text-slate-500"
        :class="!themeStore.nightMode && 'text-slate-400'"
      >
        Нет добавленных чатов. Нажмите «+ Чат» для выбора.
      </p>
      <button
        v-for="fork in chatStore.forks"
        :key="fork.id"
        type="button"
        class="flex w-full flex-col border-b border-slate-800 px-4 py-3 text-left hover:bg-slate-800 dark:border-slate-800"
        :class="[
          chatStore.activeForkId === fork.id ? 'bg-slate-800' : '',
          !themeStore.nightMode && 'border-slate-100 hover:bg-slate-100',
          !themeStore.nightMode && chatStore.activeForkId === fork.id && 'bg-slate-100',
        ]"
        @click="chatStore.selectFork(fork.id)"
      >
        <span
          class="truncate font-medium text-slate-100"
          :class="!themeStore.nightMode && 'text-slate-800'"
        >
          {{ fork.title }}
        </span>
        <span class="mt-0.5 text-xs text-slate-500">{{ fork.syncMode }}</span>
      </button>
    </div>

    <AddChatModal v-if="showAddModal" @close="showAddModal = false" />
  </aside>
</template>
