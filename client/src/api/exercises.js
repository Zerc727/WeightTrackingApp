import client from './client';

export const listExercises = () => client.get('/exercises');
export const createExercise = (name) => client.post('/exercises', { name });
export const deleteExercise = (id) => client.delete(`/exercises/${id}`);
