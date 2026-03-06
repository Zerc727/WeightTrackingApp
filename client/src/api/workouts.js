import client from './client';

export const listWorkouts = () => client.get('/workouts');
export const createWorkout = (data) => client.post('/workouts', data);
export const getWorkout = (id) => client.get(`/workouts/${id}`);
export const updateWorkout = (id, data) => client.put(`/workouts/${id}`, data);
export const deleteWorkout = (id) => client.delete(`/workouts/${id}`);

export const addExercise = (wId, data) => client.post(`/workouts/${wId}/exercises`, data);
export const updateExercise = (wId, weId, data) => client.put(`/workouts/${wId}/exercises/${weId}`, data);
export const removeExercise = (wId, weId) => client.delete(`/workouts/${wId}/exercises/${weId}`);

export const addSet = (wId, weId, data) => client.post(`/workouts/${wId}/exercises/${weId}/sets`, data);
export const updateSet = (wId, weId, sId, data) => client.put(`/workouts/${wId}/exercises/${weId}/sets/${sId}`, data);
export const deleteSet = (wId, weId, sId) => client.delete(`/workouts/${wId}/exercises/${weId}/sets/${sId}`);
