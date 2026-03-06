import { defineStore } from 'pinia';
import { ref } from 'vue';
import * as api from '../api/workouts';

export const useWorkoutsStore = defineStore('workouts', () => {
  const workouts = ref([]);
  const currentWorkout = ref(null);
  const loading = ref(false);

  async function fetchWorkouts() {
    loading.value = true;
    try {
      const { data } = await api.listWorkouts();
      workouts.value = data;
    } finally {
      loading.value = false;
    }
  }

  async function fetchWorkout(id) {
    loading.value = true;
    try {
      const { data } = await api.getWorkout(id);
      currentWorkout.value = data;
    } finally {
      loading.value = false;
    }
  }

  async function createWorkout(payload) {
    const { data } = await api.createWorkout(payload);
    workouts.value.unshift(data);
    return data;
  }

  async function updateWorkout(id, payload) {
    const { data } = await api.updateWorkout(id, payload);
    const idx = workouts.value.findIndex(w => w.id === id);
    if (idx !== -1) workouts.value[idx] = { ...workouts.value[idx], ...data };
    if (currentWorkout.value?.id === id) {
      currentWorkout.value = { ...currentWorkout.value, ...data };
    }
    return data;
  }

  async function deleteWorkout(id) {
    await api.deleteWorkout(id);
    workouts.value = workouts.value.filter(w => w.id !== id);
    if (currentWorkout.value?.id === id) currentWorkout.value = null;
  }

  // ── Workout exercises ──

  async function addExercise(workoutId, payload) {
    const { data } = await api.addExercise(workoutId, payload);
    if (currentWorkout.value?.id === workoutId) {
      currentWorkout.value.exercises.push(data);
    }
    return data;
  }

  async function updateExercise(workoutId, weId, payload) {
    const { data } = await api.updateExercise(workoutId, weId, payload);
    if (currentWorkout.value?.id === workoutId) {
      const idx = currentWorkout.value.exercises.findIndex(e => e.id === weId);
      if (idx !== -1) currentWorkout.value.exercises[idx] = { ...currentWorkout.value.exercises[idx], ...data };
    }
    return data;
  }

  async function removeExercise(workoutId, weId) {
    await api.removeExercise(workoutId, weId);
    if (currentWorkout.value?.id === workoutId) {
      currentWorkout.value.exercises = currentWorkout.value.exercises.filter(e => e.id !== weId);
    }
  }

  // ── Sets ──

  async function addSet(workoutId, weId, payload) {
    const { data } = await api.addSet(workoutId, weId, payload);
    if (currentWorkout.value?.id === workoutId) {
      const ex = currentWorkout.value.exercises.find(e => e.id === weId);
      if (ex) ex.sets.push(data);
    }
    return data;
  }

  async function updateSet(workoutId, weId, setId, payload) {
    const { data } = await api.updateSet(workoutId, weId, setId, payload);
    if (currentWorkout.value?.id === workoutId) {
      const ex = currentWorkout.value.exercises.find(e => e.id === weId);
      if (ex) {
        const idx = ex.sets.findIndex(s => s.id === setId);
        if (idx !== -1) ex.sets[idx] = { ...ex.sets[idx], ...data };
      }
    }
    return data;
  }

  async function deleteSet(workoutId, weId, setId) {
    await api.deleteSet(workoutId, weId, setId);
    if (currentWorkout.value?.id === workoutId) {
      const ex = currentWorkout.value.exercises.find(e => e.id === weId);
      if (ex) ex.sets = ex.sets.filter(s => s.id !== setId);
    }
  }

  return {
    workouts, currentWorkout, loading,
    fetchWorkouts, fetchWorkout, createWorkout, updateWorkout, deleteWorkout,
    addExercise, updateExercise, removeExercise,
    addSet, updateSet, deleteSet
  };
});
