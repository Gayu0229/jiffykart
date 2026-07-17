
import axios from 'axios';
import { ApiService } from './apiService';

// The base URL for your Spring Boot backend
// const BASE_URL = 'http://localhost:8080/api';
const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';

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
      // Auto-logout on token expiration (401)
      if (status === 401) {
        ApiService.logout();
      }
    } else if (error.request) {
      console.debug("Remote API offline. Local state maintained.");
    }
    return Promise.reject(error);
  }
);

export default api;
