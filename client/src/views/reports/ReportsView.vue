<template>
  <div class="max-w-4xl mx-auto px-4 py-6">
    <h1 class="text-2xl font-bold mb-6">Reports</h1>

    <!-- Filters -->
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-4 mb-6">
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div>
          <label class="label">Exercise</label>
          <select v-model="selectedExercise" class="input w-full" @change="fetchData">
            <option value="">— Select —</option>
            <option v-for="e in exercisesStore.exercises" :key="e.id" :value="e.id">{{ e.name }}</option>
          </select>
        </div>
        <div>
          <label class="label">Metric</label>
          <select v-model="metric" class="input w-full" @change="fetchData">
            <option value="max_weight">Max Weight</option>
            <option value="volume">Volume (reps × weight)</option>
          </select>
        </div>
        <div>
          <label class="label">From</label>
          <input v-model="from" type="date" class="input w-full" @change="fetchData" />
        </div>
        <div>
          <label class="label">To</label>
          <input v-model="to" type="date" class="input w-full" @change="fetchData" />
        </div>
      </div>
    </div>

    <div v-if="!selectedExercise" class="text-center text-gray-400 py-12">
      Select an exercise to see your progress.
    </div>

    <div v-else-if="loading" class="text-center text-gray-400 py-12">Loading…</div>

    <div v-else-if="reportData.length === 0" class="text-center text-gray-400 py-12">
      No data found for this exercise and date range.
    </div>

    <template v-else>
      <!-- Chart -->
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-4 mb-6">
        <Line :data="chartData" :options="chartOptions" />
      </div>

      <!-- Table -->
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <table class="w-full text-sm">
          <thead class="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th class="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-300">Date</th>
              <th class="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-300">Workout</th>
              <th class="px-4 py-3 text-right font-medium text-gray-500 dark:text-gray-300">
                {{ metric === 'max_weight' ? 'Max Weight (lbs)' : 'Volume (lbs)' }}
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(row, idx) in reportData" :key="idx"
              class="border-t dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
              <td class="px-4 py-3">{{ formatDate(row.workout_date) }}</td>
              <td class="px-4 py-3">{{ row.workout_name }}</td>
              <td class="px-4 py-3 text-right font-mono">{{ row.value != null ? row.value.toFixed(1) : '—' }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { Line } from 'vue-chartjs';
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement,
  LineElement, Title, Tooltip, Legend
} from 'chart.js';
import { useExercisesStore } from '../../store/exercises';
import { getExerciseProgress } from '../../api/reports';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const exercisesStore = useExercisesStore();

const selectedExercise = ref('');
const metric = ref('max_weight');
const from = ref('');
const to = ref('');
const loading = ref(false);
const reportData = ref([]);

onMounted(() => exercisesStore.fetchExercises());

async function fetchData() {
  if (!selectedExercise.value) return;
  loading.value = true;
  try {
    const params = { metric: metric.value };
    if (from.value) params.from = from.value;
    if (to.value) params.to = to.value;
    const { data } = await getExerciseProgress(selectedExercise.value, params);
    reportData.value = data.data;
  } catch {
    reportData.value = [];
  } finally {
    loading.value = false;
  }
}

function formatDate(d) {
  const [y, m, day] = d.split('-');
  return new Date(Number(y), Number(m) - 1, Number(day)).toLocaleDateString(undefined, {
    month: 'short', day: 'numeric', year: 'numeric'
  });
}

const chartData = computed(() => ({
  labels: reportData.value.map(r => r.workout_date),
  datasets: [{
    label: metric.value === 'max_weight' ? 'Max Weight (lbs)' : 'Volume (lbs)',
    data: reportData.value.map(r => r.value),
    borderColor: '#6366f1',
    backgroundColor: '#6366f120',
    tension: 0.3,
    fill: true
  }]
}));

const chartOptions = {
  responsive: true,
  plugins: {
    legend: { display: false },
    title: { display: false }
  },
  scales: {
    y: { beginAtZero: false }
  }
};
</script>

<style scoped>
.input {
  @apply border dark:border-gray-600 rounded px-3 py-2 bg-white dark:bg-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500;
}
.label {
  @apply block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300;
}
</style>
