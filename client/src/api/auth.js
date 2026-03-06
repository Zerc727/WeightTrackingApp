import client from './client';

export const login = (username, password) => client.post('/auth/login', { username, password });
export const logout = () => client.post('/auth/logout');
export const me = () => client.get('/auth/me');
export const changePassword = (currentPassword, newPassword) =>
  client.post('/auth/change-password', { currentPassword, newPassword });
