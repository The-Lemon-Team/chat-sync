<script setup lang="ts">
import { onMounted, onUnmounted, ref, watch } from 'vue';
import { useAccountStore } from '@/stores/account';
import { useAuthStore } from '@/stores/auth';
import { useChatStore } from '@/stores/chat';
import { useThemeStore } from '@/stores/theme';
import { useUiStore } from '@/stores/ui';
import { connectSocket, disconnectSocket } from '@/services/socket';
import SafeModeBanner from '@/components/SafeModeBanner.vue';
import ForkSidebar from '@/components/ForkSidebar.vue';
import ChatPanel from '@/components/ChatPanel.vue';
import AddChatModal from '@/components/AddChatModal.vue';
import AppMenuSidebar from '@/components/AppMenuSidebar.vue';
import AuthView from '@/components/AuthView.vue';
import CreateChatAccountModal from '@/components/CreateChatAccountModal.vue';
import TelegramAuthModal from '@/components/TelegramAuthModal.vue';

const authStore = useAuthStore();
const accountStore = useAccountStore();
const chatStore = useChatStore();
const themeStore = useThemeStore();
const uiStore = useUiStore();

const showAddModal = ref(false);
const showTelegramAuth = ref(false);
const showCreateChatAccount = ref(false);

onMounted(async () => {
  themeStore.init();
  await authStore.init();
});

watch(
  () => authStore.isAuthenticated,
  async (authenticated) => {
    if (authenticated) {
      connectSocket();
      chatStore.initSocketListeners();
      await accountStore.loadAccounts();
      if (accountStore.selectedChatAccountId) {
        await chatStore.loadForks(accountStore.selectedChatAccountId);
      }
    } else {
      chatStore.cleanup();
      disconnectSocket();
      accountStore.reset();
      chatStore.reset();
    }
  },
  { immediate: true },
);

watch(
  () => accountStore.selectedChatAccountId,
  async (id) => {
    if (id && authStore.isAuthenticated) {
      await chatStore.loadForks(id);
    }
  },
);

function handleSavedMessages() {
  const saved = chatStore.forks.find((f) => f.type === 'SAVED_MESSAGES');
  if (saved) chatStore.selectFork(saved.id);
  uiStore.closeMenu();
}

function handleNewChat() {
  if (!accountStore.selectedChatAccountId) {
    showCreateChatAccount.value = true;
  } else {
    showAddModal.value = true;
  }
  uiStore.closeMenu();
}

function handleAddHub() {
  showTelegramAuth.value = true;
  uiStore.closeMenu();
}

function handleAddChatAccount() {
  showCreateChatAccount.value = true;
  uiStore.closeMenu();
}

async function handleHubConnected() {
  showTelegramAuth.value = false;
  await accountStore.loadAccounts();
}

async function handleChatAccountCreated(id: string) {
  showCreateChatAccount.value = false;
  await chatStore.loadForks(id);
}

function handleLogout() {
  authStore.logout();
  uiStore.closeMenu();
}

onUnmounted(() => {
  chatStore.cleanup();
  disconnectSocket();
});
</script>

<template>
  <AuthView v-if="authStore.initialized && !authStore.isAuthenticated" />

  <div v-else-if="authStore.initialized" class="flex h-screen flex-col">
    <SafeModeBanner />
    <div class="flex min-h-0 flex-1">
      <ForkSidebar />
      <ChatPanel />
    </div>

    <AppMenuSidebar
      v-if="uiStore.menuOpen"
      @close="uiStore.closeMenu()"
      @add-hub="handleAddHub"
      @add-chat-account="handleAddChatAccount"
      @new-group="handleNewChat"
      @new-channel="handleNewChat"
      @saved-messages="handleSavedMessages"
      @settings="uiStore.closeMenu()"
      @logout="handleLogout"
    />

    <AddChatModal v-if="showAddModal" @close="showAddModal = false" />
    <TelegramAuthModal
      v-if="showTelegramAuth"
      @close="showTelegramAuth = false"
      @success="handleHubConnected"
    />
    <CreateChatAccountModal
      v-if="showCreateChatAccount"
      @close="showCreateChatAccount = false"
      @created="handleChatAccountCreated"
    />
  </div>

  <div
    v-else
    class="flex h-screen items-center justify-center bg-slate-950 text-slate-400"
  >
    Загрузка...
  </div>
</template>
