<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors">
    <NavBar v-if="authStore.isLoggedIn" />
    <main :class="authStore.isLoggedIn ? 'pt-16' : ''">
      <RouterView />
    </main>
  </div>
</template>

<script setup>
import { onBeforeMount } from 'vue';
import { RouterView } from 'vue-router';
import NavBar from './components/NavBar.vue';
import { useAuthStore } from './store/auth';
import { useUiStore } from './store/ui';

const authStore = useAuthStore();
const uiStore = useUiStore();

onBeforeMount(() => {
  uiStore.initTheme();
  authStore.restoreSession();
});
</script>
