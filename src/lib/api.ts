import { apiClient } from "../../lib/api/client";

// API endpoints (READ ONLY - no mutation operations)
export const adminApi = {
  // Dashboard APIs
  dashboard: {
    getStats: () => apiClient.get("/admin/dashboard/stats"),
    getUserGrowth: () => apiClient.get("/admin/dashboard/user-growth"),
    getRevenueStats: () => apiClient.get("/admin/dashboard/revenue"),
  },

  // Posting management APIs (READ ONLY)
  postings: {
    list: (params: Record<string, unknown>) =>
      apiClient.get("/admin/postings", { params }),
    get: (postingId: string) =>
      apiClient.get(`/admin/postings/${postingId}`),
  },

  // Report management APIs (READ ONLY)
  reports: {
    list: (params: Record<string, unknown>) =>
      apiClient.get("/admin/reports", { params }),
    get: (reportId: string) => apiClient.get(`/admin/reports/${reportId}`),
  },

  // User management APIs (READ ONLY - using Cognito API)
  users: {
    list: (params: Record<string, unknown>) =>
      apiClient.get("/admin/users", { params }),
    search: (query: string) =>
      apiClient.get("/admin/users/search", { params: { q: query } }),
    get: (userSub: string) => apiClient.get(`/admin/users/${userSub}`),
  },
};
