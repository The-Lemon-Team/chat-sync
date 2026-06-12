import { defineStore } from 'pinia';
import { ref, watch } from 'vue';

const STORAGE_KEY = 'chat-sync-night-mode';

export const useThemeStore = defineStore('theme', () => {
  const nightMode = ref(loadNightMode());

  function loadNightMode(): boolean {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === null) return true;
    return stored === 'true';
  }

  function applyNightMode(value: boolean) {
    document.documentElement.classList.toggle('dark', value);
  }

  function toggleNightMode() {
    nightMode.value = !nightMode.value;
  }

  function init() {
    applyNightMode(nightMode.value);
  }

  watch(nightMode, (value) => {
    localStorage.setItem(STORAGE_KEY, String(value));
    applyNightMode(value);
  });

  return { nightMode, toggleNightMode, init };
});
