<template>
  <div class="max-w-3xl mx-auto px-4 py-6">
    <h1 class="text-2xl font-bold mb-6">Settings</h1>

    <!-- Tabs -->
    <div class="flex gap-1 mb-6 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg w-fit">
      <RouterLink to="/settings/exercises" class="tab-link">Exercises</RouterLink>
      <RouterLink v-if="authStore.isAdmin" to="/settings/users" class="tab-link">Users</RouterLink>
      <RouterLink to="/settings/password" class="tab-link">Password</RouterLink>
    </div>

    <RouterView />
  </div>
</template>

<script setup>
import { RouterLink, RouterView } from 'vue-router';
import { useAuthStore } from '../../store/auth';

const authStore = useAuthStore();
</script>

<style scoped>
.tab-link {
  @apply px-4 py-2 text-sm font-medium rounded-md text-gray-600 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-700 transition-colors;
}
.tab-link.router-link-active {
  @apply bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 shadow-sm;
}
</style>
