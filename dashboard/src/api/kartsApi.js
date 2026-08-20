import axiosClient from './axiosClient';
import { broadcastActivity } from '../utils/activityBus';

export const getKarts = (espaceId) => axiosClient.get(`/espaces/${espaceId}/karts`);

export const createKart = async (espaceId, data) => {
  const res = await axiosClient.post(`/espaces/${espaceId}/karts`, data);
  broadcastActivity('KART_CREATED', 'Karting', { espaceId, numero: data.numero });
  return res;
};

export const updateKart = async (espaceId, kartId, data) => {
  const res = await axiosClient.put(`/espaces/${espaceId}/karts/${kartId}`, data);
  broadcastActivity('KART_UPDATED', 'Karting', { espaceId, kartId, numero: data.numero });
  return res;
};

export const deleteKart = async (espaceId, kartId, reason) => {
  const res = await axiosClient.delete(`/espaces/${espaceId}/karts/${kartId}`, { params: reason ? { reason } : undefined });
  broadcastActivity('KART_DELETED', 'Karting', { espaceId, kartId });
  return res;
};

export const reorderKarts = async (espaceId, karts) => {
  const res = await axiosClient.put(`/espaces/${espaceId}/karts/reorder`, { karts });
  broadcastActivity('KARTS_REORDERED', 'Karting', { espaceId });
  return res;
};
