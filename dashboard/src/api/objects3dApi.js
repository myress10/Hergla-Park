import axiosClient from './axiosClient';

export const getObjects3D = () => axiosClient.get('/objects3d');

export const uploadObject3D = (formData) =>
  axiosClient.post('/objects3d/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

export const getSpaceScene = (id) => axiosClient.get(`/espaces/${id}/scene`);

export const updateSpaceScene = (id, placements) =>
  axiosClient.put(`/espaces/${id}/scene`, { placements });

export const resetSpaceScene = (id, reason) =>
  axiosClient.post(`/espaces/${id}/scene/reset`, {}, { params: reason ? { reason } : undefined });

export const setAsOriginalSpaceScene = (id, reason) =>
  axiosClient.post(`/espaces/${id}/scene/set-as-original`, {}, { params: reason ? { reason } : undefined });

