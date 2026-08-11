import axiosClient from './axiosClient';

export const getKarts = (espaceId) => axiosClient.get(`/espaces/${espaceId}/karts`);

export const createKart = (espaceId, data) => axiosClient.post(`/espaces/${espaceId}/karts`, data);

export const updateKart = (espaceId, kartId, data) =>
  axiosClient.put(`/espaces/${espaceId}/karts/${kartId}`, data);

export const deleteKart = (espaceId, kartId) =>
  axiosClient.delete(`/espaces/${espaceId}/karts/${kartId}`);

export const reorderKarts = (espaceId, karts) =>
  axiosClient.put(`/espaces/${espaceId}/karts/reorder`, { karts });
