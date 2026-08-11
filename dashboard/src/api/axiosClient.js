import axios from 'axios';

// Priority order:
// 1. VITE_API_URL env var (set in Vercel dashboard for production)
// 2. Production backend URL (always safe to use — CORS is configured for all dashboard domains)
// 3. localhost for local dev
const PROD_BACKEND = 'https://backend-app-nine-mu.vercel.app/api';
const isLocalDev =
  typeof window !== 'undefined' &&
  (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

const defaultBaseUrl = isLocalDev
  ? 'http://localhost:5000/api'
  : PROD_BACKEND;

const axiosClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || defaultBaseUrl,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

// Request interceptor: attach JWT token
axiosClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('hergla_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: handle 401 unauthorized
axiosClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Do NOT redirect for auth endpoints — let the caller handle the error
    const isAuthEndpoint =
      error.config?.url?.includes('/auth/login') ||
      error.config?.url?.includes('/auth/register');

    if (error.response?.status === 401 && !isAuthEndpoint) {
      // Clear stored auth data and redirect to login
      localStorage.removeItem('hergla_token');
      localStorage.removeItem('hergla_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default axiosClient;
