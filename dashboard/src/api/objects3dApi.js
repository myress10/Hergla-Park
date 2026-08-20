import axiosClient from './axiosClient';
import { broadcastActivity } from '../utils/activityBus';

export const getObjects3D = () => axiosClient.get('/objects3d');

export const uploadObject3D = async (formData) => {
  const res = await axiosClient.post('/objects3d/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  broadcastActivity('OBJECT3D_UPLOADED', 'Studio 3D', {});
  return res;
};

export const getSpaceScene = (id) => axiosClient.get(`/espaces/${id}/scene`);

export const updateSpaceScene = async (id, placements) => {
  const res = await axiosClient.put(`/espaces/${id}/scene`, { placements });
  broadcastActivity('SCENE_SAVED', 'Studio 3D', { id });
  return res;
};

export const resetSpaceScene = async (id, reason) => {
  const res = await axiosClient.post(`/espaces/${id}/scene/reset`, {}, { params: reason ? { reason } : undefined });
  broadcastActivity('SCENE_RESET', 'Studio 3D', { id });
  return res;
};

export const setAsOriginalSpaceScene = async (id, reason) => {
  const res = await axiosClient.post(`/espaces/${id}/scene/set-as-original`, {}, { params: reason ? { reason } : undefined });
  broadcastActivity('SCENE_SET_ORIGINAL', 'Studio 3D', { id });
  return res;
};
