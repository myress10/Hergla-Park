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

export const resetSpaceScene = (id) => axiosClient.post(`/espaces/${id}/scene/reset`);

export const setAsOriginalSpaceScene = (id) => axiosClient.post(`/espaces/${id}/scene/set-as-original`);

