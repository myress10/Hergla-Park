import axiosClient from './axiosClient';
import { broadcastActivity } from '../utils/activityBus';

export const getUsers = () => axiosClient.get('/users');

export const getUser = (id) => axiosClient.get(`/users/${id}`);

export const updateUser = async (id, data, reason) => {
  const res = await axiosClient.put(`/users/${id}`, data, { params: reason ? { reason } : undefined });
  broadcastActivity('USER_UPDATED', 'Utilisateur', { id, nom: data.nom });
  return res;
};

export const deleteUser = async (id, reason) => {
  const res = await axiosClient.delete(`/users/${id}`, { params: reason ? { reason } : undefined });
  broadcastActivity('USER_DELETED', 'Utilisateur', { id });
  return res;
};

export const createUser = async (data, reason) => {
  const res = await axiosClient.post('/users', data, { params: reason ? { reason } : undefined });
  broadcastActivity('USER_CREATED', 'Utilisateur', { email: data.email, nom: data.nom });
  return res;
};

export const updateUserPassword = async (id, password, reason) => {
  const res = await axiosClient.patch(`/users/${id}/password`, { password }, { params: reason ? { reason } : undefined });
  broadcastActivity('PASSWORD_CHANGED', 'Sécurité', { id });
  return res;
};
