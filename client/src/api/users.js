import client from './client';

export const listUsers = () => client.get('/users');
export const createUser = (data) => client.post('/users', data);
export const updateUser = (id, data) => client.put(`/users/${id}`, data);
export const deleteUser = (id) => client.delete(`/users/${id}`);
export const resetPassword = (id, newPassword) => client.post(`/users/${id}/reset-password`, { newPassword });
