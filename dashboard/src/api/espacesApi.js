import axiosClient from './axiosClient';

export const getEspaces = () => axiosClient.get('/espaces');

export const getEspace = (id) => axiosClient.get(`/espaces/${id}`);

export const createEspace = (data, reason) =>
  axiosClient.post('/espaces', data, { params: reason ? { reason } : undefined });

export const updateEspace = (id, data, reason) =>
  axiosClient.put(`/espaces/${id}`, data, { params: reason ? { reason } : undefined });

export const deleteEspace = (id, reason) =>
  axiosClient.delete(`/espaces/${id}`, { params: reason ? { reason } : undefined });
