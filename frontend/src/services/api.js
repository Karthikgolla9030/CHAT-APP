import axios from 'axios';
import { API_BASE_URL } from '../utils/constants';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    config.metadata = { startTime: performance.now() };
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => {
    if (response.config.metadata) {
      const endTime = performance.now();
      const duration = endTime - response.config.metadata.startTime;
      console.log(`[API_TRACE] [SUCCESS] ${response.config.method.toUpperCase()} ${response.config.url} | Start: ${response.config.metadata.startTime.toFixed(2)}ms | End: ${endTime.toFixed(2)}ms | Duration: ${duration.toFixed(2)}ms`);
    }
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const refreshToken = localStorage.getItem('refresh_token');
      if (refreshToken) {
        try {
          const res = await axios.post(`${API_BASE_URL}/auth/token/refresh/`, {
            refresh: refreshToken,
          });
          const newAccess = res.data.access;
          localStorage.setItem('access_token', newAccess);
          api.defaults.headers.common['Authorization'] = `Bearer ${newAccess}`;
          return api(originalRequest);
        } catch (refreshErr) {
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          window.location.href = '/login';
        }
      }
    }
    if (error.config && error.config.metadata) {
      const endTime = performance.now();
      const duration = endTime - error.config.metadata.startTime;
      console.log(`[API_TRACE] [ERROR] ${error.config.method.toUpperCase()} ${error.config.url} | Start: ${error.config.metadata.startTime.toFixed(2)}ms | End: ${endTime.toFixed(2)}ms | Duration: ${duration.toFixed(2)}ms`);
    }
    return Promise.reject(error);
  }
);

export default api;
