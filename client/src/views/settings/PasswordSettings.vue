<template>
  <div class="max-w-sm">
    <h2 class="text-lg font-semibold mb-4">Change Password</h2>

    <div v-if="authStore.mustChangePassword" class="bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-700 text-yellow-800 dark:text-yellow-200 rounded px-4 py-3 mb-4 text-sm">
      You must change your password before continuing.
    </div>

    <form @submit.prevent="handleChange" class="space-y-4">
      <div>
        <label class="label">Current Password</label>
        <input v-model="current" type="password" class="input w-full" autocomplete="current-password" required />
      </div>
      <div>
        <label class="label">New Password</label>
        <input v-model="newPw" type="password" class="input w-full" autocomplete="new-password" required minlength="6" />
      </div>
      <div>
        <label class="label">Confirm New Password</label>
        <input v-model="confirm" type="password" class="input w-full" autocomplete="new-password" required />
      </div>

      <AppAlert :message="alert.message" :type="alert.type" />

      <button type="submit" :disabled="saving" class="btn-primary w-full py-2 text-sm">
        {{ saving ? 'Saving…' : 'Change Password' }}
      </button>
    </form>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../../store/auth';
import AppAlert from '../../components/AppAlert.vue';

const authStore = useAuthStore();
const router = useRouter();

const current = ref('');
const newPw = ref('');
const confirm = ref('');
const saving = ref(false);
const alert = reactive({ message: '', type: 'error' });

async function handleChange() {
  alert.message = '';
  if (newPw.value !== confirm.value) {
    alert.message = 'New passwords do not match';
    alert.type = 'error';
    return;
  }
  if (newPw.value.length < 6) {
    alert.message = 'Password must be at least 6 characters';
    alert.type = 'error';
    return;
  }
  saving.value = true;
  try {
    await authStore.changePassword(current.value, newPw.value);
    alert.message = 'Password changed successfully';
    alert.type = 'success';
    current.value = '';
    newPw.value = '';
    confirm.value = '';
    if (!authStore.mustChangePassword) {
      setTimeout(() => router.push('/tracking'), 1000);
    }
  } catch (err) {
    alert.message = err.response?.data?.error || 'Failed to change password';
    alert.type = 'error';
  } finally {
    saving.value = false;
  }
}
</script>

<style scoped>
.input {
  @apply border dark:border-gray-600 rounded px-3 py-2 bg-white dark:bg-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500;
}
.label {
  @apply block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300;
}
.btn-primary {
  @apply bg-indigo-600 text-white rounded font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors;
}
</style>
