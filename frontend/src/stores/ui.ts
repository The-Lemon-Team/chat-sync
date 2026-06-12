import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useUiStore = defineStore('ui', () => {
  const menuOpen = ref(false);

  function openMenu() {
    menuOpen.value = true;
  }

  function closeMenu() {
    menuOpen.value = false;
  }

  return { menuOpen, openMenu, closeMenu };
});
