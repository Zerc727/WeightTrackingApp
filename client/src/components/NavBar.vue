<template>
  <nav class="fixed top-0 inset-x-0 z-30 bg-white dark:bg-gray-800 shadow">
    <div class="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
      <!-- Logo -->
      <RouterLink to="/tracking" class="font-bold text-lg text-indigo-600 dark:text-indigo-400">
        WeightTracker
      </RouterLink>

      <!-- Desktop links -->
      <div class="hidden sm:flex items-center gap-6">
        <RouterLink to="/tracking" class="nav-link">Workouts</RouterLink>
        <RouterLink to="/reports" class="nav-link">Reports</RouterLink>
        <RouterLink to="/settings/exercises" class="nav-link">Settings</RouterLink>
      </div>

      <!-- Right side -->
      <div class="flex items-center gap-3">
        <!-- Dark mode toggle -->
        <button @click="uiStore.toggleTheme()" class="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors" title="Toggle dark mode">
          <span v-if="uiStore.darkMode">☀️</span>
          <span v-else>🌙</span>
        </button>

        <!-- Username + logout (desktop) -->
        <span class="hidden sm:inline text-sm text-gray-600 dark:text-gray-300">{{ authStore.user?.username }}</span>
        <button @click="handleLogout" class="hidden sm:inline text-sm px-3 py-1 rounded bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors">
          Logout
        </button>

        <!-- Mobile hamburger -->
        <button @click="menuOpen = !menuOpen" class="sm:hidden p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path v-if="!menuOpen" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/>
            <path v-else stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
          </svg>
        </button>
      </div>
    </div>

    <!-- Mobile menu -->
    <div v-if="menuOpen" class="sm:hidden bg-white dark:bg-gray-800 border-t dark:border-gray-700 px-4 pb-3 space-y-1">
      <RouterLink to="/tracking" class="mobile-link" @click="menuOpen = false">Workouts</RouterLink>
      <RouterLink to="/reports" class="mobile-link" @click="menuOpen = false">Reports</RouterLink>
      <RouterLink to="/settings/exercises" class="mobile-link" @click="menuOpen = false">Settings</RouterLink>
      <div class="pt-2 border-t dark:border-gray-700 flex items-center justify-between">
        <span class="text-sm text-gray-500 dark:text-gray-400">{{ authStore.user?.username }}</span>
        <button @click="handleLogout" class="text-sm text-red-600 dark:text-red-400">Logout</button>
      </div>
    </div>
  </nav>
</template>

<script setup>
import { ref } from 'vue';
import { RouterLink, useRouter } from 'vue-router';
import { useAuthStore } from '../store/auth';
import { useUiStore } from '../store/ui';

const authStore = useAuthStore();
const uiStore = useUiStore();
const router = useRouter();
const menuOpen = ref(false);

async function handleLogout() {
  authStore.logout();
  menuOpen.value = false;
  router.push('/login');
}
</script>

<style scoped>
.nav-link {
  @apply text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors;
}
.mobile-link {
  @apply block py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:text-indigo-600 dark:hover:text-indigo-400;
}
</style>
