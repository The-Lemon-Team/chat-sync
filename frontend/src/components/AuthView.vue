<script setup lang="ts">
import { ref } from 'vue';
import { useAuthStore } from '@/stores/auth';
import { useThemeStore } from '@/stores/theme';

const authStore = useAuthStore();
const themeStore = useThemeStore();

const mode = ref<'login' | 'register'>('login');
const email = ref('');
const password = ref('');
const name = ref('');

async function submit() {
  if (mode.value === 'register') {
    await authStore.register(email.value, password.value, name.value || undefined);
  } else {
    await authStore.login(email.value, password.value);
  }
}

function toggleMode() {
  mode.value = mode.value === 'login' ? 'register' : 'login';
  authStore.error = null;
}
</script>

<template>
  <div
    class="flex min-h-screen items-center justify-center bg-slate-950 px-4"
    :class="!themeStore.nightMode && 'bg-slate-100'"
  >
    <div
      class="w-full max-w-sm rounded-xl border border-slate-800 bg-slate-900 p-6 shadow-xl"
      :class="!themeStore.nightMode && 'border-slate-200 bg-white'"
    >
      <h1
        class="mb-1 text-center text-xl font-semibold text-slate-100"
        :class="!themeStore.nightMode && 'text-slate-900'"
      >
        Chat-Sync
      </h1>
      <p
        class="mb-6 text-center text-sm text-slate-400"
        :class="!themeStore.nightMode && 'text-slate-500'"
      >
        {{ mode === 'login' ? 'Вход в аккаунт' : 'Регистрация' }}
      </p>

      <form class="space-y-4" @submit.prevent="submit">
        <div v-if="mode === 'register'">
          <label class="mb-1 block text-xs text-slate-400">Имя (необязательно)</label>
          <input
            v-model="name"
            type="text"
            class="auth-input"
            placeholder="Ваше имя"
          />
        </div>

        <div>
          <label class="mb-1 block text-xs text-slate-400">Email</label>
          <input
            v-model="email"
            type="email"
            required
            class="auth-input"
            placeholder="you@example.com"
          />
        </div>

        <div>
          <label class="mb-1 block text-xs text-slate-400">Пароль</label>
          <input
            v-model="password"
            type="password"
            required
            minlength="8"
            class="auth-input"
            placeholder="Минимум 8 символов"
          />
        </div>

        <p v-if="authStore.error" class="text-sm text-red-400">
          {{ authStore.error }}
        </p>

        <button
          type="submit"
          class="w-full rounded-lg bg-indigo-600 py-2.5 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50"
          :disabled="authStore.loading"
        >
          {{ authStore.loading ? 'Загрузка...' : mode === 'login' ? 'Войти' : 'Зарегистрироваться' }}
        </button>
      </form>

      <p class="mt-4 text-center text-sm text-slate-400">
        <button
          type="button"
          class="text-indigo-400 hover:underline"
          @click="toggleMode"
        >
          {{ mode === 'login' ? 'Создать аккаунт' : 'Уже есть аккаунт? Войти' }}
        </button>
      </p>
    </div>
  </div>
</template>

<style scoped>
.auth-input {
  @apply w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 outline-none focus:border-indigo-500;
}

html:not(.dark) .auth-input {
  @apply border-slate-300 bg-white text-slate-900;
}
</style>
