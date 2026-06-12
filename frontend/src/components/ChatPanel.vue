<script setup lang="ts">
import { computed, ref } from 'vue';
import { useChatStore } from '@/stores/chat';
import { useThemeStore } from '@/stores/theme';
import { mapMessagesToVac } from '@/composables/useVacMapper';

const chatStore = useChatStore();
const themeStore = useThemeStore();
const roomId = computed(() => chatStore.activeForkId ?? 'empty');
const currentUserId = ref('local-user');

const vacMessages = computed(() =>
  mapMessagesToVac(chatStore.messages, currentUserId.value),
);

async function onSendMessage(event: CustomEvent) {
  const detail = event.detail[0] as { content?: string; message?: { content?: string } };
  const content = detail?.content ?? detail?.message?.content;
  if (!content?.trim()) return;
  await chatStore.sendMessage(content.trim());
}
</script>

<template>
  <section
    class="flex flex-1 flex-col bg-slate-950 dark:bg-slate-950"
    :class="!themeStore.nightMode && 'bg-slate-50'"
  >
    <header
      v-if="chatStore.activeFork"
      class="flex items-center justify-between border-b border-slate-800 px-4 py-3 dark:border-slate-800"
      :class="!themeStore.nightMode && 'border-slate-200 bg-white'"
    >
      <div>
        <h2 class="font-semibold">{{ chatStore.activeFork.title }}</h2>
        <p class="text-xs text-slate-500">
          {{ chatStore.activeFork.syncMode }}
          <span v-if="chatStore.syncProgress">
            · sync: {{ chatStore.syncProgress.status }}
          </span>
        </p>
      </div>
      <button
        type="button"
        class="rounded-lg bg-indigo-600 px-3 py-1.5 text-sm hover:bg-indigo-500 disabled:opacity-50"
        :disabled="chatStore.syncing"
        @click="chatStore.triggerSync(chatStore.activeFork!.id)"
      >
        {{ chatStore.syncing ? 'Sync...' : 'Sync' }}
      </button>
    </header>

    <div v-if="!chatStore.activeFork" class="flex flex-1 items-center justify-center text-slate-500">
      Выберите чат или добавьте новый
    </div>

    <div v-else class="flex min-h-0 flex-1 flex-col">
      <vue-advanced-chat
        :key="roomId"
        height="100%"
        :current-user-id="currentUserId"
        :room-id="roomId"
        :rooms="JSON.stringify([{ roomId, roomName: chatStore.activeFork.title, users: [] }])"
        :messages="JSON.stringify(vacMessages)"
        :messages-loaded="true"
        :show-files="false"
        :show-audio="false"
        :show-emojis="false"
        :show-reaction-emojis="false"
        :text-messages="JSON.stringify({ ROOM_EMPTY: 'Нет сообщений', CONVERSATION_STARTED: 'Начало' })"
        @send-message="onSendMessage"
      />
    </div>

    <p v-if="chatStore.error" class="border-t border-red-900 bg-red-950 px-4 py-2 text-sm text-red-300">
      {{ chatStore.error }}
    </p>
  </section>
</template>

<style>
vue-advanced-chat {
  --chat-bg-color: #020617;
  --chat-content-bg-color: #0f172a;
  --chat-sender-bg-color: #312e81;
  --chat-message-color: #e2e8f0;
  flex: 1;
  min-height: 0;
}
</style>
