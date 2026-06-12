import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import { userAuthApi } from '@/api';
import { ApiError, getStoredToken, setStoredToken } from '@/api/client';
import type { User } from '@/types';

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);
  const initialized = ref(false);

  const isAuthenticated = computed(() => !!user.value);

  async function init() {
    const token = getStoredToken();
    if (!token) {
      initialized.value = true;
      return;
    }

    loading.value = true;
    try {
      user.value = await userAuthApi.me();
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) {
        setStoredToken(null);
      }
      user.value = null;
    } finally {
      loading.value = false;
      initialized.value = true;
    }
  }

  async function register(email: string, password: string, name?: string) {
    loading.value = true;
    error.value = null;
    try {
      const result = await userAuthApi.register(email, password, name);
      setStoredToken(result.accessToken);
      user.value = result.user;
      return true;
    } catch (e) {
      error.value = extractError(e);
      return false;
    } finally {
      loading.value = false;
    }
  }

  async function login(email: string, password: string) {
    loading.value = true;
    error.value = null;
    try {
      const result = await userAuthApi.login(email, password);
      setStoredToken(result.accessToken);
      user.value = result.user;
      return true;
    } catch (e) {
      error.value = extractError(e);
      return false;
    } finally {
      loading.value = false;
    }
  }

  function logout() {
    setStoredToken(null);
    user.value = null;
  }

  function extractError(e: unknown): string {
    if (e instanceof ApiError) {
      const body = e.body as { message?: string | string[] } | undefined;
      if (Array.isArray(body?.message)) return body.message.join(', ');
      if (typeof body?.message === 'string') return body.message;
      return `Ошибка ${e.status}`;
    }
    if (e instanceof Error) return e.message;
    return 'Неизвестная ошибка';
  }

  return {
    user,
    loading,
    error,
    initialized,
    isAuthenticated,
    init,
    register,
    login,
    logout,
  };
});
