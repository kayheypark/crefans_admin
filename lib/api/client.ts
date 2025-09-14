import axios from "axios";
import { getApiUrl } from "../../utils/env";

export const apiClient = axios.create({
  baseURL: getApiUrl(),
  withCredentials: true,
  timeout: 10000,
});

// Add request interceptor to include auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("adminAccessToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
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
      localStorage.removeItem("adminAccessToken");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);