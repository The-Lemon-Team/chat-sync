<script setup lang="ts">
import { computed } from 'vue';
import { useSafetyStore } from '@/stores/safety';

const safety = useSafetyStore();

const isLocked = computed(
  () => safety.safeModeEnabled && !safety.liveSendUnlocked,
);
</script>

<template>
  <div
    class="border-b px-4 py-2 text-sm"
    :class="
      isLocked
        ? 'border-safe-border bg-safe-bg text-safe-text'
        : 'border-emerald-700 bg-emerald-950 text-emerald-200'
    "
  >
    <div class="flex flex-wrap items-center justify-between gap-2">
      <span class="font-medium">{{ safety.statusLabel }}</span>
      <div class="flex gap-2">
        <button
          v-if="safety.safeModeEnabled && !safety.liveSendUnlocked"
          type="button"
          class="rounded bg-amber-600 px-2 py-1 text-xs text-white hover:bg-amber-500"
          @click="safety.unlockLiveSend()"
        >
          Разблокировать LIVE
        </button>
        <button
          v-if="safety.liveSendUnlocked"
          type="button"
          class="rounded bg-slate-700 px-2 py-1 text-xs hover:bg-slate-600"
          @click="safety.lockLiveSend()"
        >
          Заблокировать снова
        </button>
        <button
          type="button"
          class="rounded px-2 py-1 text-xs"
          :class="
            safety.safeModeEnabled
              ? 'bg-slate-700 hover:bg-slate-600'
              : 'bg-red-800 hover:bg-red-700'
          "
          @click="
            safety.safeModeEnabled
              ? safety.disableSafeMode()
              : safety.enableSafeMode()
          "
        >
          {{ safety.safeModeEnabled ? 'Выключить Safe Mode' : 'Включить Safe Mode' }}
        </button>
      </div>
    </div>
    <p v-if="isLocked" class="mt-1 text-xs opacity-80">
      Сообщения сохраняются локально. Отправка в Telegram заблокирована до явного разрешения.
    </p>
  </div>
</template>
