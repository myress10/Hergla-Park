import axiosClient from './axiosClient';

export const getKarts = (espaceId) => axiosClient.get(`/espaces/${espaceId}/karts`);

export const createKart = (espaceId, data) => axiosClient.post(`/espaces/${espaceId}/karts`, data);

export const updateKart = (espaceId, kartId, data) =>
  axiosClient.put(`/espaces/${espaceId}/karts/${kartId}`, data);

export const deleteKart = (espaceId, kartId, reason) =>
  axiosClient.delete(`/espaces/${espaceId}/karts/${kartId}`, { params: reason ? { reason } : undefined });

export const reorderKarts = (espaceId, karts) =>
  axiosClient.put(`/espaces/${espaceId}/karts/reorder`, { karts });
