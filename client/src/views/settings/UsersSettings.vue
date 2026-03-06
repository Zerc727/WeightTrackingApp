<template>
  <div>
    <div class="flex items-center justify-between mb-4">
      <h2 class="text-lg font-semibold">Users</h2>
      <button @click="openCreate" class="btn-primary text-sm px-3 py-1">+ Add User</button>
    </div>

    <AppAlert :message="alert.message" :type="alert.type" />

    <div class="bg-white dark:bg-gray-800 rounded-lg shadow divide-y dark:divide-gray-700">
      <div v-for="u in users" :key="u.id" class="px-4 py-3">
        <div class="flex items-center justify-between">
          <div>
            <span class="font-medium">{{ u.username }}</span>
            <span class="ml-2 text-xs px-2 py-0.5 rounded-full"
              :class="u.role === 'admin' ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300' : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'">
              {{ u.role }}
            </span>
            <span v-if="u.must_change_password" class="ml-1 text-xs text-yellow-600 dark:text-yellow-400">(must change pw)</span>
          </div>
          <div class="flex gap-2">
            <button @click="openEdit(u)" class="text-sm text-indigo-600 dark:text-indigo-400 hover:underline">Edit</button>
            <button @click="openResetPw(u)" class="text-sm text-gray-500 hover:underline">Reset PW</button>
            <button v-if="u.id !== authStore.user.id" @click="confirmDel(u)"
              class="text-sm text-red-500 hover:text-red-700">Delete</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Create / Edit User Modal -->
    <AppModal v-model="showUserModal" :title="editUser ? 'Edit User' : 'Create User'">
      <form @submit.prevent="saveUser" class="space-y-4">
        <div>
          <label class="label">Username</label>
          <input v-model="form.username" type="text" class="input w-full" required />
        </div>
        <div v-if="!editUser">
          <label class="label">Password</label>
          <input v-model="form.password" type="password" class="input w-full" required minlength="6" />
        </div>
        <div>
          <label class="label">Role</label>
          <select v-model="form.role" class="input w-full">
            <option value="user">User</option>
            <option value="admin">Admin</option>
          </select>
        </div>
        <AppAlert :message="formError" />
        <div class="flex justify-end gap-3">
          <button type="button" @click="showUserModal = false" class="btn-secondary px-4 py-2 text-sm">Cancel</button>
          <button type="submit" :disabled="saving" class="btn-primary px-4 py-2 text-sm">
            {{ saving ? 'Saving…' : (editUser ? 'Save' : 'Create') }}
          </button>
        </div>
      </form>
    </AppModal>

    <!-- Reset Password Modal -->
    <AppModal v-model="showResetPw" title="Reset Password">
      <form @submit.prevent="doResetPw" class="space-y-4">
        <p class="text-sm text-gray-600 dark:text-gray-300">Reset password for <strong>{{ resetTarget?.username }}</strong>. User will be required to change it on next login.</p>
        <div>
          <label class="label">New Password</label>
          <input v-model="newPw" type="password" class="input w-full" required minlength="6" />
        </div>
        <AppAlert :message="resetError" />
        <div class="flex justify-end gap-3">
          <button type="button" @click="showResetPw = false" class="btn-secondary px-4 py-2 text-sm">Cancel</button>
          <button type="submit" :disabled="saving" class="btn-primary px-4 py-2 text-sm">Reset</button>
        </div>
      </form>
    </AppModal>

    <!-- Confirm Delete -->
    <ConfirmDialog
      v-model="showDeleteConfirm"
      title="Delete User"
      :message="`Delete user '${deleteTarget?.username}'? All their workouts will be deleted too.`"
      @confirm="doDelete"
    />
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { useAuthStore } from '../../store/auth';
import * as usersApi from '../../api/users';
import AppAlert from '../../components/AppAlert.vue';
import AppModal from '../../components/AppModal.vue';
import ConfirmDialog from '../../components/ConfirmDialog.vue';

const authStore = useAuthStore();
const users = ref([]);
const alert = reactive({ message: '', type: 'error' });

onMounted(loadUsers);

async function loadUsers() {
  try {
    const { data } = await usersApi.listUsers();
    users.value = data;
  } catch {
    alert.message = 'Failed to load users';
  }
}

// ── Create / Edit ──
const showUserModal = ref(false);
const editUser = ref(null);
const form = reactive({ username: '', password: '', role: 'user' });
const formError = ref('');
const saving = ref(false);

function openCreate() {
  editUser.value = null;
  form.username = '';
  form.password = '';
  form.role = 'user';
  formError.value = '';
  showUserModal.value = true;
}

function openEdit(u) {
  editUser.value = u;
  form.username = u.username;
  form.role = u.role;
  formError.value = '';
  showUserModal.value = true;
}

async function saveUser() {
  formError.value = '';
  saving.value = true;
  try {
    if (editUser.value) {
      const { data } = await usersApi.updateUser(editUser.value.id, { username: form.username, role: form.role });
      const idx = users.value.findIndex(u => u.id === editUser.value.id);
      if (idx !== -1) users.value[idx] = data;
    } else {
      const { data } = await usersApi.createUser({ username: form.username, password: form.password, role: form.role });
      users.value.push(data);
    }
    showUserModal.value = false;
  } catch (err) {
    formError.value = err.response?.data?.error || 'Failed to save user';
  } finally {
    saving.value = false;
  }
}

// ── Reset Password ──
const showResetPw = ref(false);
const resetTarget = ref(null);
const newPw = ref('');
const resetError = ref('');

function openResetPw(u) {
  resetTarget.value = u;
  newPw.value = '';
  resetError.value = '';
  showResetPw.value = true;
}

async function doResetPw() {
  resetError.value = '';
  saving.value = true;
  try {
    await usersApi.resetPassword(resetTarget.value.id, newPw.value);
    showResetPw.value = false;
    alert.message = `Password reset for ${resetTarget.value.username}`;
    alert.type = 'success';
    await loadUsers();
  } catch (err) {
    resetError.value = err.response?.data?.error || 'Failed to reset password';
  } finally {
    saving.value = false;
  }
}

// ── Delete ──
const showDeleteConfirm = ref(false);
const deleteTarget = ref(null);

function confirmDel(u) {
  deleteTarget.value = u;
  showDeleteConfirm.value = true;
}

async function doDelete() {
  try {
    await usersApi.deleteUser(deleteTarget.value.id);
    users.value = users.value.filter(u => u.id !== deleteTarget.value.id);
  } catch (err) {
    alert.message = err.response?.data?.error || 'Failed to delete user';
    alert.type = 'error';
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
.btn-secondary {
  @apply bg-gray-100 dark:bg-gray-700 rounded font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors;
}
</style>
