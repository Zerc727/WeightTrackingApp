<template>
  <div>
    <div class="flex items-center justify-between mb-4">
      <h2 class="text-lg font-semibold">Exercises</h2>
      <button v-if="authStore.isAdmin" @click="showAdd = true" class="btn-primary text-sm px-3 py-1">+ Add</button>
    </div>

    <AppAlert :message="alert.message" :type="alert.type" />

    <div v-if="store.loading" class="text-gray-400 py-4">Loading…</div>

    <div v-else-if="store.exercises.length === 0" class="text-gray-400 py-4">No exercises yet.</div>

    <div v-else class="bg-white dark:bg-gray-800 rounded-lg shadow divide-y dark:divide-gray-700">
      <div v-for="ex in store.exercises" :key="ex.id" class="flex items-center justify-between px-4 py-3">
        <span>{{ ex.name }}</span>
        <button v-if="authStore.isAdmin" @click="confirmDelete(ex)"
          class="text-red-500 hover:text-red-700 text-sm">Delete</button>
      </div>
    </div>

    <!-- Add Exercise Modal -->
    <AppModal v-model="showAdd" title="Add Exercise">
      <form @submit.prevent="addExercise">
        <label class="label">Name</label>
        <input v-model="newName" type="text" class="input w-full mb-4" placeholder="e.g. Bench Press" required />
        <AppAlert :message="addError" />
        <div class="flex justify-end gap-3 mt-4">
          <button type="button" @click="showAdd = false" class="btn-secondary px-4 py-2 text-sm">Cancel</button>
          <button type="submit" :disabled="saving" class="btn-primary px-4 py-2 text-sm">
            {{ saving ? 'Adding…' : 'Add' }}
          </button>
        </div>
      </form>
    </AppModal>

    <!-- Confirm Delete -->
    <ConfirmDialog
      v-model="showConfirmDelete"
      title="Delete Exercise"
      :message="`Delete '${deleteTarget?.name}'? This will fail if the exercise is used in any workout.`"
      @confirm="doDelete"
    />
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { useExercisesStore } from '../../store/exercises';
import { useAuthStore } from '../../store/auth';
import AppAlert from '../../components/AppAlert.vue';
import AppModal from '../../components/AppModal.vue';
import ConfirmDialog from '../../components/ConfirmDialog.vue';

const store = useExercisesStore();
const authStore = useAuthStore();

const showAdd = ref(false);
const newName = ref('');
const saving = ref(false);
const addError = ref('');
const alert = reactive({ message: '', type: 'error' });
const showConfirmDelete = ref(false);
const deleteTarget = ref(null);

onMounted(() => store.fetchExercises());

async function addExercise() {
  addError.value = '';
  saving.value = true;
  try {
    await store.addExercise(newName.value);
    newName.value = '';
    showAdd.value = false;
  } catch (err) {
    addError.value = err.response?.data?.error || 'Failed to add exercise';
  } finally {
    saving.value = false;
  }
}

function confirmDelete(ex) {
  deleteTarget.value = ex;
  showConfirmDelete.value = true;
}

async function doDelete() {
  try {
    await store.deleteExercise(deleteTarget.value.id);
  } catch (err) {
    alert.message = err.response?.data?.error || 'Failed to delete exercise';
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
