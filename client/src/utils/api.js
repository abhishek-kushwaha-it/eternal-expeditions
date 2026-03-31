import axios from 'axios';

// Environment-based API configuration via Vite's import.meta.env
const apiUrl = import.meta.env.VITE_API_URL;
const backendUrl = import.meta.env.VITE_BACKEND_URL;

const API_BASE_URL = apiUrl;
export const BACKEND_URL = backendUrl;
export const IMAGE_URL = `${BACKEND_URL}/img`;

// Stripe public key from environment
export const STRIPE_PUBLIC_KEY = import.meta.env.VITE_STRIPE_PUBLIC_KEY || '';

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

// Interceptor for handling FormData
api.interceptors.request.use(
  (config) => {
    // If data is FormData, let axios handle Content-Type automatically
    if (config.data instanceof FormData) {
      // Remove Content-Type header so axios sets it with proper boundary
      delete config.headers['Content-Type'];
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => Promise.reject(error)
);

export default api;
