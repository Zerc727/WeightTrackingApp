<template>
  <div class="max-w-3xl mx-auto px-4 py-6">
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-2xl font-bold">Workouts</h1>
      <RouterLink to="/tracking/new" class="btn-primary px-4 py-2 text-sm">+ New Workout</RouterLink>
    </div>

    <div v-if="store.loading" class="text-center text-gray-400 py-12">Loading…</div>

    <div v-else-if="store.workouts.length === 0" class="text-center text-gray-400 py-12">
      No workouts yet. Create your first one!
    </div>

    <div v-else class="space-y-3">
      <RouterLink
        v-for="w in store.workouts"
        :key="w.id"
        :to="`/tracking/${w.id}`"
        class="block bg-white dark:bg-gray-800 rounded-lg shadow p-4 hover:shadow-md transition-shadow"
      >
        <div class="flex items-center justify-between">
          <div>
            <p class="font-semibold">{{ w.name }}</p>
            <p class="text-sm text-gray-500 dark:text-gray-400">{{ formatDate(w.workout_date) }}</p>
          </div>
          <div class="text-sm text-gray-400">
            {{ w.exercise_count }} exercise{{ w.exercise_count !== 1 ? 's' : '' }}
          </div>
        </div>
        <p v-if="w.notes" class="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-1">{{ w.notes }}</p>
      </RouterLink>
    </div>
  </div>
</template>

<script setup>
import { onMounted } from 'vue';
import { RouterLink } from 'vue-router';
import { useWorkoutsStore } from '../../store/workouts';

const store = useWorkoutsStore();

onMounted(() => store.fetchWorkouts());

function formatDate(d) {
  const [y, m, day] = d.split('-');
  return new Date(Number(y), Number(m) - 1, Number(day)).toLocaleDateString(undefined, {
    weekday: 'short', year: 'numeric', month: 'short', day: 'numeric'
  });
}
</script>

<style scoped>
.btn-primary {
  @apply bg-indigo-600 text-white rounded font-medium hover:bg-indigo-700 transition-colors;
}
</style>
