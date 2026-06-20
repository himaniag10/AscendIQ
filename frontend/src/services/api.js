import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
});

api.interceptors.request.use(
  (config) => {
    // Don't set Content-Type for FormData - let axios/browser handle it
    if (!(config.data instanceof FormData)) {
      config.headers['Content-Type'] = 'application/json';
    }
    const token = window.localStorage.getItem('ascendiq-token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const apiError = error?.response?.data?.message || error.message || 'Network error';
    return Promise.reject(new Error(apiError));
  }
);

export { api };
