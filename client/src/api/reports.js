import client from './client';

export const getExerciseProgress = (exerciseId, params) =>
  client.get(`/reports/exercise/${exerciseId}`, { params });
