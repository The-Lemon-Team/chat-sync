<script setup lang="ts">
import { ref } from 'vue';
import { telegramAuthApi } from '@/api';
import { useAccountStore } from '@/stores/account';
import { useThemeStore } from '@/stores/theme';
import type { AuthStepResult } from '@/types';

const emit = defineEmits<{ close: []; success: [] }>();

const accountStore = useAccountStore();
const themeStore = useThemeStore();

const step = ref<'phone' | 'code' | 'password'>('phone');
const phone = ref('');
const code = ref('');
const password = ref('');
const loading = ref(false);
const error = ref<string | null>(null);
const normalizedPhone = ref('');

async function startAuth() {
  loading.value = true;
  error.value = null;
  try {
    const result = await telegramAuthApi.start(phone.value);
    normalizedPhone.value = result.phone;
    step.value = 'code';
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Ошибка отправки кода';
  } finally {
    loading.value = false;
  }
}

async function submitCode() {
  loading.value = true;
  error.value = null;
  try {
    const result = await telegramAuthApi.submitCode(
      normalizedPhone.value,
      code.value,
    );
    await handleStepResult(result);
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Неверный код';
  } finally {
    loading.value = false;
  }
}

async function submitPassword() {
  loading.value = true;
  error.value = null;
  try {
    const result = await telegramAuthApi.submitPassword(
      normalizedPhone.value,
      password.value,
    );
    await handleStepResult(result);
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Неверный пароль';
  } finally {
    loading.value = false;
  }
}

async function handleStepResult(result: AuthStepResult) {
  if (result.step === 'password_required') {
    step.value = 'password';
    return;
  }
  if (result.step === 'authorized') {
    await accountStore.loadAccounts();
    emit('success');
    emit('close');
  }
}
</script>

<template>
  <Teleport to="body">
    <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div
        class="w-full max-w-sm rounded-xl border border-slate-800 bg-slate-900 p-6 shadow-xl"
        :class="!themeStore.nightMode && 'border-slate-200 bg-white'"
      >
        <h2
          class="mb-4 text-lg font-semibold text-slate-100"
          :class="!themeStore.nightMode && 'text-slate-900'"
        >
          Подключить Hub Telegram Account
        </h2>

        <form
          v-if="step === 'phone'"
          class="space-y-4"
          @submit.prevent="startAuth"
        >
          <div>
            <label class="mb-1 block text-xs text-slate-400">Номер телефона</label>
            <input
              v-model="phone"
              type="tel"
              required
              class="modal-input"
              placeholder="+79001234567"
            />
          </div>
          <p v-if="error" class="text-sm text-red-400">{{ error }}</p>
          <div class="flex gap-2">
            <button
              type="button"
              class="flex-1 rounded-lg border border-slate-700 py-2 text-sm text-slate-300 hover:bg-slate-800"
              @click="emit('close')"
            >
              Отмена
            </button>
            <button
              type="submit"
              class="flex-1 rounded-lg bg-indigo-600 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50"
              :disabled="loading"
            >
              {{ loading ? '...' : 'Отправить код' }}
            </button>
          </div>
        </form>

        <form
          v-else-if="step === 'code'"
          class="space-y-4"
          @submit.prevent="submitCode"
        >
          <p class="text-sm text-slate-400">
            Код отправлен на {{ normalizedPhone }}
          </p>
          <div>
            <label class="mb-1 block text-xs text-slate-400">Код из SMS/Telegram</label>
            <input
              v-model="code"
              type="text"
              required
              class="modal-input"
              placeholder="12345"
            />
          </div>
          <p v-if="error" class="text-sm text-red-400">{{ error }}</p>
          <button
            type="submit"
            class="w-full rounded-lg bg-indigo-600 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50"
            :disabled="loading"
          >
            {{ loading ? '...' : 'Подтвердить' }}
          </button>
        </form>

        <form
          v-else
          class="space-y-4"
          @submit.prevent="submitPassword"
        >
          <p class="text-sm text-slate-400">Введите пароль двухфакторной аутентификации</p>
          <div>
            <label class="mb-1 block text-xs text-slate-400">Пароль 2FA</label>
            <input
              v-model="password"
              type="password"
              required
              class="modal-input"
            />
          </div>
          <p v-if="error" class="text-sm text-red-400">{{ error }}</p>
          <button
            type="submit"
            class="w-full rounded-lg bg-indigo-600 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50"
            :disabled="loading"
          >
            {{ loading ? '...' : 'Войти' }}
          </button>
        </form>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.modal-input {
  @apply w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 outline-none focus:border-indigo-500;
}

html:not(.dark) .modal-input {
  @apply border-slate-300 bg-white text-slate-900;
}
</style>
