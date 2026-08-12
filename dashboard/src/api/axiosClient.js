import axios from 'axios';

// Priority order:
// 1. VITE_API_URL env var (set in Vercel dashboard for production)
// 2. Render production backend URL (live at hergla-park.onrender.com)
// 3. localhost for local dev
const PROD_BACKEND = 'https://hergla-park.onrender.com/api';
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
  // 30s timeout — accounts for Render free-tier cold start (~20s on first request after sleep)
  timeout: 30000,
});

// Request interceptor: attach JWT token & auto-attach ROOT audit reason for write operations
axiosClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('hergla_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Attach mandatory audit reason for ROOT write operations if not explicitly provided
    const isWrite = ['post', 'put', 'delete', 'patch'].includes(config.method?.toLowerCase());
    if (isWrite) {
      try {
        const userStr = localStorage.getItem('hergla_user');
        if (userStr) {
          const user = JSON.parse(userStr);
          if (user?.role === 'ROOT') {
            config.params = config.params || {};
            if (!config.params.reason) {
              config.params.reason = "Intervention d'administration ROOT";
            }
          }
        }
      } catch {
        // Ignore parse errors
      }
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
