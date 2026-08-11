import axiosClient from './axiosClient';

export const getUsers = () => axiosClient.get('/users');

export const getUser = (id) => axiosClient.get(`/users/${id}`);

export const updateUser = (id, data, reason) =>
  axiosClient.put(`/users/${id}`, data, { params: reason ? { reason } : undefined });

export const deleteUser = (id, reason) =>
  axiosClient.delete(`/users/${id}`, { params: reason ? { reason } : undefined });

export const createUser = (data, reason) =>
  axiosClient.post('/users', data, { params: reason ? { reason } : undefined });

export const updateUserPassword = (id, password, reason) =>
  axiosClient.patch(`/users/${id}/password`, { password }, { params: reason ? { reason } : undefined });
