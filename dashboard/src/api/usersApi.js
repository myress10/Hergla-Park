import axiosClient from './axiosClient';

export const getUsers = () => axiosClient.get('/users');

export const getUser = (id) => axiosClient.get(`/users/${id}`);

export const updateUser = (id, data) => axiosClient.put(`/users/${id}`, data);

export const deleteUser = (id) => axiosClient.delete(`/users/${id}`);

export const createUser = (data) => axiosClient.post('/users', data);

export const updateUserPassword = (id, password) =>
  axiosClient.patch(`/users/${id}/password`, { password });
