import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import * as authApi from '../api/auth';

export const useAuthStore = defineStore('auth', () => {
  const token = ref(null);
  const user = ref(null);

  const isLoggedIn = computed(() => !!token.value);
  const isAdmin = computed(() => user.value?.role === 'admin');
  const mustChangePassword = computed(() => !!user.value?.must_change_password);

  function restoreSession() {
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    if (storedToken && storedUser) {
      token.value = storedToken;
      user.value = JSON.parse(storedUser);
    }
  }

  async function login(username, password) {
    const { data } = await authApi.login(username, password);
    token.value = data.token;
    user.value = data.user;
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
  }

  function logout() {
    token.value = null;
    user.value = null;
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }

  async function changePassword(currentPassword, newPassword) {
    const { data } = await authApi.changePassword(currentPassword, newPassword);
    token.value = data.token;
    user.value = data.user;
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
  }

  return { token, user, isLoggedIn, isAdmin, mustChangePassword, restoreSession, login, logout, changePassword };
});
