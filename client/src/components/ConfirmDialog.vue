<template>
  <AppModal :modelValue="modelValue" :title="title" @update:modelValue="$emit('update:modelValue', $event)">
    <p class="text-gray-600 dark:text-gray-300 mb-6">{{ message }}</p>
    <div class="flex justify-end gap-3">
      <button @click="$emit('update:modelValue', false)" class="btn-secondary">Cancel</button>
      <button @click="confirm" class="btn-danger">{{ confirmLabel }}</button>
    </div>
  </AppModal>
</template>

<script setup>
import AppModal from './AppModal.vue';

const props = defineProps({
  modelValue: Boolean,
  title: { type: String, default: 'Confirm' },
  message: { type: String, default: 'Are you sure?' },
  confirmLabel: { type: String, default: 'Delete' }
});
const emit = defineEmits(['update:modelValue', 'confirm']);

function confirm() {
  emit('confirm');
  emit('update:modelValue', false);
}
</script>

<style scoped>
.btn-secondary {
  @apply px-4 py-2 text-sm rounded bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors;
}
.btn-danger {
  @apply px-4 py-2 text-sm rounded bg-red-600 text-white hover:bg-red-700 transition-colors;
}
</style>
