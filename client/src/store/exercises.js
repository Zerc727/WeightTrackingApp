import { defineStore } from 'pinia';
import { ref } from 'vue';
import * as api from '../api/exercises';

export const useExercisesStore = defineStore('exercises', () => {
  const exercises = ref([]);
  const loading = ref(false);

  async function fetchExercises() {
    loading.value = true;
    try {
      const { data } = await api.listExercises();
      exercises.value = data;
    } finally {
      loading.value = false;
    }
  }

  async function addExercise(name) {
    const { data } = await api.createExercise(name);
    exercises.value.push(data);
    exercises.value.sort((a, b) => a.name.localeCompare(b.name));
    return data;
  }

  async function deleteExercise(id) {
    await api.deleteExercise(id);
    exercises.value = exercises.value.filter(e => e.id !== id);
  }

  return { exercises, loading, fetchExercises, addExercise, deleteExercise };
});
