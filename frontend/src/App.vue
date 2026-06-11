<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue';
import { useAccountStore } from '@/stores/account';
import { useChatStore } from '@/stores/chat';
import SafeModeBanner from '@/components/SafeModeBanner.vue';
import ForkSidebar from '@/components/ForkSidebar.vue';
import ChatPanel from '@/components/ChatPanel.vue';

const accountStore = useAccountStore();
const chatStore = useChatStore();

onMounted(async () => {
  chatStore.initSocketListeners();
  await accountStore.loadAccounts();
  if (accountStore.selectedAccountId) {
    await chatStore.loadForks(accountStore.selectedAccountId);
  }
});

onUnmounted(() => {
  chatStore.cleanup();
});
</script>

<template>
  <div class="flex h-screen flex-col">
    <SafeModeBanner />
    <div class="flex min-h-0 flex-1">
      <ForkSidebar />
      <ChatPanel />
    </div>
  </div>
</template>
