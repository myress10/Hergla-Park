import axiosClient from './axiosClient';
import { broadcastActivity } from '../utils/activityBus';

export const getEspaces = () => axiosClient.get('/espaces');

export const getEspace = (id) => axiosClient.get(`/espaces/${id}`);

export const createEspace = async (data, reason) => {
  const res = await axiosClient.post('/espaces', data, { params: reason ? { reason } : undefined });
  broadcastActivity('ESPACE_CREATED', 'Espace', { nom: data.nom });
  return res;
};

export const updateEspace = async (id, data, reason) => {
  const res = await axiosClient.put(`/espaces/${id}`, data, { params: reason ? { reason } : undefined });
  broadcastActivity(data.statut ? 'ESPACE_STATUS_UPDATE' : 'ESPACE_UPDATED', 'Espace', { id, ...data });
  return res;
};

export const deleteEspace = async (id, reason) => {
  const res = await axiosClient.delete(`/espaces/${id}`, { params: reason ? { reason } : undefined });
  broadcastActivity('ESPACE_DELETED', 'Espace', { id });
  return res;
};
