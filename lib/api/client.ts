import axios from "axios";
import { getApiUrl } from "../../utils/env";

export const apiClient = axios.create({
  baseURL: getApiUrl(),
  withCredentials: true,
  timeout: 10000,
});

// Add request interceptor (cookie-based auth, no need for Authorization header)
apiClient.interceptors.request.use(
  (config) => {
    // Using cookie-based authentication, no need to set Authorization header
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor to handle errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Prevent infinite loops by checking current location
      if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
        window.location.replace('/login');
      }
    }
    return Promise.reject(error);
  }
);