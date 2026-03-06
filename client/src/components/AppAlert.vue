<template>
  <div v-if="message" :class="classes" class="px-4 py-3 rounded text-sm mb-4">
    {{ message }}
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  message: String,
  type: { type: String, default: 'error' }
});

const classes = computed(() => ({
  'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300': props.type === 'error',
  'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300': props.type === 'success',
  'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300': props.type === 'warning'
}));
</script>
