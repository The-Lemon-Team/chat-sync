<script setup lang="ts">
import { computed } from 'vue';
import { useAccountStore } from '@/stores/account';
import { useAuthStore } from '@/stores/auth';
import { useThemeStore } from '@/stores/theme';
import type { AppAccount } from '@/types';

const emit = defineEmits<{
  close: [];
  'add-hub': [];
  'add-chat-account': [];
  'new-group': [];
  'new-channel': [];
  'saved-messages': [];
  settings: [];
  logout: [];
}>();

const authStore = useAuthStore();
const accountStore = useAccountStore();
const themeStore = useThemeStore();

const displayName = computed(() => {
  if (authStore.user?.name) return authStore.user.name;
  if (authStore.user?.email) return authStore.user.email.split('@')[0];
  return 'User';
});

function chatAccountLabel(account: AppAccount): string {
  return account.displayName ?? 'Chat Account';
}

function chatAccountInitials(account: AppAccount): string {
  const name = account.displayName ?? 'CA';
  return name.slice(0, 2).toUpperCase();
}

function selectChatAccount(id: string) {
  accountStore.selectChatAccount(id);
}
</script>

<template>
  <Teleport to="body">
    <div class="fixed inset-0 z-50 flex">
      <button
        type="button"
        class="absolute inset-0 bg-black/50"
        aria-label="Close menu"
        @click="emit('close')"
      />

      <aside
        class="relative flex h-full w-72 max-w-[85vw] flex-col bg-slate-900 shadow-xl animate-slide-in-left"
        :class="!themeStore.nightMode && 'bg-white'"
        role="dialog"
        aria-label="Main menu"
      >
        <div class="flex items-center gap-3 px-4 py-4">
          <div
            class="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-sm font-semibold text-white"
          >
            {{ displayName.slice(0, 2).toUpperCase() }}
          </div>
          <div class="min-w-0 flex-1">
            <p
              class="truncate font-semibold text-slate-100"
              :class="!themeStore.nightMode && 'text-slate-900'"
            >
              {{ displayName }}
            </p>
            <p v-if="authStore.user?.email" class="truncate text-xs text-slate-400">
              {{ authStore.user.email }}
            </p>
          </div>
        </div>

        <div class="mx-4 border-t border-slate-700" />

        <!-- Hub Telegram Account -->
        <div class="px-2 py-2">
          <p class="px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
            Hub Telegram
          </p>

          <div
            v-if="accountStore.hub"
            class="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-slate-300"
          >
            <span
              class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-xs font-medium text-white"
            >
              H
            </span>
            <span class="min-w-0 flex-1 truncate">{{ accountStore.hub.phone }}</span>
            <span
              class="shrink-0 rounded bg-indigo-900 px-1.5 py-0.5 text-[10px] font-medium text-indigo-300"
            >
              Hub
            </span>
          </div>

          <button
            v-else
            type="button"
            class="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm text-indigo-400 hover:bg-slate-800"
            @click="emit('add-hub')"
          >
            <span
              class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-dashed border-slate-600 text-lg text-slate-400"
            >
              +
            </span>
            <span>Подключить Hub</span>
          </button>
        </div>

        <div class="mx-4 border-t border-slate-700" />

        <!-- Chat Accounts -->
        <div class="px-2 py-2">
          <p class="px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
            Chat Accounts
          </p>

          <button
            v-for="account in accountStore.chatAccounts"
            :key="account.id"
            type="button"
            class="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm hover:bg-slate-800"
            :class="accountStore.selectedChatAccountId === account.id ? 'bg-slate-800' : ''"
            @click="selectChatAccount(account.id)"
          >
            <span
              class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-700 text-xs font-medium text-slate-300"
            >
              {{ chatAccountInitials(account) }}
            </span>
            <span class="min-w-0 flex-1">
              <span class="block truncate text-slate-200">{{ chatAccountLabel(account) }}</span>
              <span class="text-[10px] text-slate-500">
                {{ account.source === 'HUB_CLONE' ? 'Копия Hub' : 'Чистый' }}
              </span>
            </span>
          </button>

          <button
            type="button"
            class="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm text-indigo-400 hover:bg-slate-800"
            @click="emit('add-chat-account')"
          >
            <span
              class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-dashed border-slate-600 text-lg text-slate-400"
            >
              +
            </span>
            <span>Новый Chat Account</span>
          </button>
        </div>

        <div class="mx-4 border-t border-slate-700" />

        <nav class="flex-1 overflow-y-auto px-2 py-2">
          <button type="button" class="menu-item" @click="emit('new-group')">
            New Group
          </button>
          <button type="button" class="menu-item" @click="emit('new-channel')">
            New Channel
          </button>
          <button type="button" class="menu-item" @click="emit('saved-messages')">
            Saved Messages
          </button>
          <button type="button" class="menu-item" @click="emit('settings')">
            Settings
          </button>
          <button
            type="button"
            class="menu-item flex items-center justify-between"
            @click="themeStore.toggleNightMode()"
          >
            <span>Night Mode</span>
            <span
              class="relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors"
              :class="themeStore.nightMode ? 'bg-indigo-600' : 'bg-slate-600'"
            >
              <span
                class="inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform"
                :class="themeStore.nightMode ? 'translate-x-4' : 'translate-x-1'"
              />
            </span>
          </button>
        </nav>

        <div class="border-t border-slate-700 px-2 py-2">
          <button
            type="button"
            class="menu-item w-full text-red-400 hover:text-red-300"
            @click="emit('logout')"
          >
            Выйти
          </button>
        </div>
        <div class="border-t border-slate-700 px-4 py-4 text-center">
          <p class="text-sm font-semibold tracking-wide text-slate-300">Chat Sync</p>
          <p class="mt-1 text-xs text-slate-500">© The Lemon Team</p>
        </div>
      </aside>
    </div>
  </Teleport>
</template>

<style scoped>
.menu-item {
  @apply flex w-full rounded-lg px-3 py-2.5 text-left text-sm text-slate-200 hover:bg-slate-800;
}

html:not(.dark) .menu-item {
  @apply text-slate-700 hover:bg-slate-100;
}

@keyframes slide-in-left {
  from { transform: translateX(-100%); }
  to { transform: translateX(0); }
}

.animate-slide-in-left {
  animation: slide-in-left 0.2s ease-out;
}
</style>
