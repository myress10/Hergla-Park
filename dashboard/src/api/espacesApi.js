import axiosClient from './axiosClient';

export const getEspaces = () => axiosClient.get('/espaces');

export const getEspace = (id) => axiosClient.get(`/espaces/${id}`);

export const createEspace = (data) => axiosClient.post('/espaces', data);

export const updateEspace = (id, data) => axiosClient.put(`/espaces/${id}`, data);

export const deleteEspace = (id) => axiosClient.delete(`/espaces/${id}`);
