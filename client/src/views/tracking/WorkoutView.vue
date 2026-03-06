<template>
  <div class="max-w-3xl mx-auto px-4 py-6">
    <!-- Header -->
    <div class="flex items-center gap-3 mb-6">
      <button @click="router.back()" class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">← Back</button>
      <h1 class="text-2xl font-bold flex-1">{{ isNew ? 'New Workout' : (editingMeta ? 'Edit Workout' : workout?.name || '') }}</h1>
      <div v-if="!isNew" class="flex gap-2">
        <button @click="editingMeta = true" v-if="!editingMeta" class="btn-secondary text-sm px-3 py-1">Edit</button>
        <button @click="showDeleteWorkout = true" class="btn-danger text-sm px-3 py-1">Delete</button>
      </div>
    </div>

    <AppAlert :message="alert.message" :type="alert.type" />

    <!-- Create / Edit Metadata Form -->
    <div v-if="isNew || editingMeta" class="bg-white dark:bg-gray-800 rounded-lg shadow p-5 mb-6">
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label class="label">Name *</label>
          <input v-model="meta.name" type="text" class="input w-full" placeholder="e.g. Upper Body A" required />
        </div>
        <div>
          <label class="label">Date *</label>
          <input v-model="meta.workout_date" type="date" class="input w-full" required />
        </div>
        <div class="sm:col-span-2">
          <label class="label">Notes</label>
          <textarea v-model="meta.notes" class="input w-full" rows="2" placeholder="Optional notes…" />
        </div>
      </div>
      <div class="flex gap-3 mt-4">
        <button @click="saveMetadata" :disabled="saving" class="btn-primary px-4 py-2 text-sm">
          {{ saving ? 'Saving…' : (isNew ? 'Create Workout' : 'Save') }}
        </button>
        <button v-if="!isNew" @click="editingMeta = false" class="btn-secondary px-4 py-2 text-sm">Cancel</button>
      </div>
    </div>

    <!-- Workout detail (exercises) -->
    <div v-if="!isNew && workout">
      <div class="flex items-center justify-between mb-3">
        <h2 class="text-lg font-semibold">Exercises</h2>
        <button @click="showAddExercise = true" class="btn-primary text-sm px-3 py-1">+ Add Exercise</button>
      </div>

      <div v-if="workout.exercises.length === 0" class="text-gray-400 text-sm py-4">No exercises yet.</div>

      <div v-for="we in workout.exercises" :key="we.id" class="bg-white dark:bg-gray-800 rounded-lg shadow p-4 mb-4">
        <div class="flex items-center justify-between mb-3">
          <h3 class="font-semibold">{{ we.exercise_name }}</h3>
          <div class="flex gap-2">
            <button @click="removeExercise(we)" class="text-red-500 hover:text-red-700 text-sm">Remove</button>
          </div>
        </div>

        <!-- Same-for-all toggle -->
        <div class="flex items-center gap-2 mb-3">
          <input :id="`same-${we.id}`" type="checkbox" v-model="we._sameForAll" @change="onSameForAllChange(we)" class="rounded" />
          <label :for="`same-${we.id}`" class="text-sm text-gray-600 dark:text-gray-300">Same for all sets</label>
        </div>

        <!-- Same-for-all mode -->
        <div v-if="we._sameForAll" class="space-y-3">
          <div class="flex flex-wrap gap-3">
            <div>
              <label class="label text-xs">Sets</label>
              <input type="number" v-model.number="we._setCount" min="1" @change="applyDefaultSets(we)"
                class="input w-20" />
            </div>
            <div>
              <label class="label text-xs">Reps</label>
              <input type="number" v-model.number="we._defaultReps" min="1" @change="applyDefaultSets(we)"
                class="input w-20" />
            </div>
            <div>
              <label class="label text-xs">Weight (lbs)</label>
              <input type="number" v-model.number="we._defaultWeight" min="0" step="2.5" @change="applyDefaultSets(we)"
                class="input w-24" />
            </div>
          </div>
          <p class="text-sm text-gray-400">{{ we.sets.length }} set{{ we.sets.length !== 1 ? 's' : '' }} saved</p>
        </div>

        <!-- Per-set mode -->
        <div v-else>
          <div v-if="we.sets.length > 0" class="mb-2">
            <div class="grid grid-cols-12 gap-2 text-xs text-gray-400 uppercase mb-1 px-1">
              <span class="col-span-2">#</span>
              <span class="col-span-4">Reps</span>
              <span class="col-span-4">Weight</span>
              <span class="col-span-2"></span>
            </div>
            <div v-for="(s, idx) in we.sets" :key="s.id" class="grid grid-cols-12 gap-2 items-center mb-1">
              <span class="col-span-2 text-sm text-gray-500">{{ idx + 1 }}</span>
              <input type="number" v-model.number="s._reps" min="1" @blur="saveSet(we, s)"
                class="col-span-4 input text-sm" />
              <input type="number" v-model.number="s._weight" min="0" step="2.5" @blur="saveSet(we, s)"
                class="col-span-4 input text-sm" placeholder="—" />
              <button @click="deleteSet(we, s)" class="col-span-2 text-red-400 hover:text-red-600 text-sm text-center">✕</button>
            </div>
          </div>
          <button @click="addSetToExercise(we)" class="text-sm text-indigo-600 dark:text-indigo-400 hover:underline">
            + Add Set
          </button>
        </div>
      </div>
    </div>

    <!-- Add Exercise Modal -->
    <AppModal v-model="showAddExercise" title="Add Exercise">
      <div class="space-y-4">
        <div>
          <label class="label">Exercise</label>
          <select v-model="newExerciseId" class="input w-full">
            <option value="">— Select exercise —</option>
            <option v-for="e in exercisesStore.exercises" :key="e.id" :value="e.id">{{ e.name }}</option>
          </select>
        </div>
        <AppAlert :message="addExerciseError" />
        <div class="flex justify-end gap-3">
          <button @click="showAddExercise = false" class="btn-secondary px-4 py-2 text-sm">Cancel</button>
          <button @click="confirmAddExercise" :disabled="!newExerciseId" class="btn-primary px-4 py-2 text-sm">Add</button>
        </div>
      </div>
    </AppModal>

    <!-- Delete Workout Confirm -->
    <ConfirmDialog
      v-model="showDeleteWorkout"
      title="Delete Workout"
      message="This will permanently delete this workout and all its sets. Are you sure?"
      @confirm="confirmDeleteWorkout"
    />
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useWorkoutsStore } from '../../store/workouts';
import { useExercisesStore } from '../../store/exercises';
import AppAlert from '../../components/AppAlert.vue';
import AppModal from '../../components/AppModal.vue';
import ConfirmDialog from '../../components/ConfirmDialog.vue';

const route = useRoute();
const router = useRouter();
const workoutsStore = useWorkoutsStore();
const exercisesStore = useExercisesStore();

const isNew = computed(() => !route.params.id);
const workout = computed(() => workoutsStore.currentWorkout);

const editingMeta = ref(false);
const saving = ref(false);
const showAddExercise = ref(false);
const showDeleteWorkout = ref(false);
const newExerciseId = ref('');
const addExerciseError = ref('');

const alert = reactive({ message: '', type: 'error' });

const meta = reactive({
  name: '',
  workout_date: new Date().toISOString().slice(0, 10),
  notes: ''
});

onMounted(async () => {
  await exercisesStore.fetchExercises();
  if (!isNew.value) {
    await workoutsStore.fetchWorkout(route.params.id);
    if (workout.value) {
      // Initialize UI state on exercises
      workout.value.exercises.forEach(initExerciseState);
    }
  }
});

function initExerciseState(we) {
  const hasSets = we.sets.length > 0;
  we._sameForAll = hasSets
    ? we.sets.every(s => s.reps === we.sets[0].reps && s.weight === we.sets[0].weight)
    : true;
  we._setCount = we.sets.length || 3;
  we._defaultReps = we.default_reps || (we.sets[0]?.reps) || 10;
  we._defaultWeight = we.default_weight || (we.sets[0]?.weight) || null;
  // Mirror set values for per-set editing
  we.sets.forEach(s => {
    s._reps = s.reps;
    s._weight = s.weight;
  });
}

async function saveMetadata() {
  if (!meta.name || !meta.workout_date) return;
  saving.value = true;
  try {
    if (isNew.value) {
      const w = await workoutsStore.createWorkout({ name: meta.name, workout_date: meta.workout_date, notes: meta.notes || null });
      router.replace(`/tracking/${w.id}`);
    } else {
      await workoutsStore.updateWorkout(workout.value.id, { name: meta.name, workout_date: meta.workout_date, notes: meta.notes || null });
      editingMeta.value = false;
    }
  } catch (err) {
    alert.message = err.response?.data?.error || 'Failed to save';
    alert.type = 'error';
  } finally {
    saving.value = false;
  }
}

// Populate meta form when workout loads
watch(workout, (w) => {
  if (w && !isNew.value) {
    meta.name = w.name;
    meta.workout_date = w.workout_date;
    meta.notes = w.notes || '';
  }
}, { immediate: true });

async function confirmAddExercise() {
  addExerciseError.value = '';
  try {
    const we = await workoutsStore.addExercise(workout.value.id, { exercise_id: newExerciseId.value });
    initExerciseState(we);
    showAddExercise.value = false;
    newExerciseId.value = '';
  } catch (err) {
    addExerciseError.value = err.response?.data?.error || 'Failed to add exercise';
  }
}

async function removeExercise(we) {
  try {
    await workoutsStore.removeExercise(workout.value.id, we.id);
  } catch (err) {
    alert.message = err.response?.data?.error || 'Failed to remove exercise';
  }
}

async function onSameForAllChange(we) {
  if (we._sameForAll) {
    await applyDefaultSets(we);
  }
}

async function applyDefaultSets(we) {
  // Update workout_exercise defaults
  await workoutsStore.updateExercise(workout.value.id, we.id, {
    default_reps: we._defaultReps,
    default_weight: we._defaultWeight
  });

  // Delete all existing sets then re-create
  for (const s of [...we.sets]) {
    await workoutsStore.deleteSet(workout.value.id, we.id, s.id);
  }
  for (let i = 0; i < we._setCount; i++) {
    const s = await workoutsStore.addSet(workout.value.id, we.id, {
      reps: we._defaultReps || 10,
      weight: we._defaultWeight || null
    });
    s._reps = s.reps;
    s._weight = s.weight;
  }
}

async function addSetToExercise(we) {
  try {
    const s = await workoutsStore.addSet(workout.value.id, we.id, { reps: 10, weight: null });
    s._reps = s.reps;
    s._weight = s.weight;
  } catch (err) {
    alert.message = err.response?.data?.error || 'Failed to add set';
  }
}

async function saveSet(we, s) {
  if (s._reps == null || s._reps === '') return;
  try {
    await workoutsStore.updateSet(workout.value.id, we.id, s.id, {
      reps: s._reps,
      weight: s._weight || null
    });
  } catch (err) {
    alert.message = err.response?.data?.error || 'Failed to save set';
  }
}

async function deleteSet(we, s) {
  try {
    await workoutsStore.deleteSet(workout.value.id, we.id, s.id);
  } catch (err) {
    alert.message = err.response?.data?.error || 'Failed to delete set';
  }
}

async function confirmDeleteWorkout() {
  try {
    await workoutsStore.deleteWorkout(workout.value.id);
    router.push('/tracking');
  } catch (err) {
    alert.message = err.response?.data?.error || 'Failed to delete workout';
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
.btn-danger {
  @apply bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 rounded font-medium hover:bg-red-200 dark:hover:bg-red-900/60 transition-colors;
}
</style>
