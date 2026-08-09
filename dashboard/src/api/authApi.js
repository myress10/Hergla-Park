import axiosClient from './axiosClient';

export const login = (email, password) =>
  axiosClient.post('/auth/login', { email, password });

export const register = (data) =>
  axiosClient.post('/auth/register', data);

export const switchCompany = (companyId) =>
  axiosClient.post('/auth/switch-company', { companyId });

