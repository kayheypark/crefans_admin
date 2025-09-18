import { apiClient } from "../../../lib/api/client";

// Admin authentication API functions
export const adminAuthAPI = {
  // Admin login
  signin: async (email: string, password: string) => {
    const response = await apiClient.post("/admin/auth/signin", {
      email,
      password,
    });
    return response.data;
  },

  // Admin logout
  signout: async () => {
    const response = await apiClient.post("/admin/auth/signout", {});
    return response.data;
  },

  // Token refresh
  refreshToken: async () => {
    const response = await apiClient.post("/admin/auth/refresh", {});
    return response.data;
  },

  // Get current admin info
  getMe: async () => {
    const response = await apiClient.get("/admin/auth/me");
    return response.data;
  },
};