import axiosClient from './axiosClient';

export const getRoles = () => axiosClient.get('/roles');

export const createRole = (data, reason) =>
  axiosClient.post('/roles', data, { params: reason ? { reason } : undefined });

export const updateRole = (id, data, reason) =>
  axiosClient.put(`/roles/${id}`, data, { params: reason ? { reason } : undefined });

export const deleteRole = (id, reason) =>
  axiosClient.delete(`/roles/${id}`, { params: reason ? { reason } : undefined });

export const assignUserRoles = (userId, data, reason) =>
  axiosClient.post(`/users/${userId}/roles`, data, { params: reason ? { reason } : undefined });
