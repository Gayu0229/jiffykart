
import axios from 'axios';
import { ApiService } from './apiService';

// The base URL for your Spring Boot backend
const getBaseUrl = () => {
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL;
  }
  if (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
    return 'http://localhost:8080/api';
  }
  return 'https://api.jiffykart.in/api';
};

const BASE_URL = getBaseUrl();

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
});

// REQUEST INTERCEPTOR: Attach JWT token from in-memory store
api.interceptors.request.use(
  (config) => {
    const token = ApiService.getAuthToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// RESPONSE INTERCEPTOR: Handle global errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      const { status } = error.response;
      // Auto-logout on token expiration (401) or forbidden role (403)
      if (status === 401 || status === 403) {
        ApiService.logout();
        window.location.reload();
      }
    } else if (error.request) {
      console.debug("Remote API offline. Local state maintained.");
    }
    return Promise.reject(error);
  }
);

export default api;
