import { apiClient } from "../../lib/api/client";

// API endpoints (READ ONLY - no mutation operations)
export const adminApi = {
  // Dashboard APIs
  dashboard: {
    getStats: () => apiClient.get("/api/admin/dashboard/stats"),
    getUserGrowth: () => apiClient.get("/api/admin/dashboard/user-growth"),
    getRevenueStats: () => apiClient.get("/api/admin/dashboard/revenue"),
  },


  // Posting management APIs (READ ONLY)
  postings: {
    list: (params: Record<string, unknown>) =>
      apiClient.get("/api/admin/postings", { params }),
    get: (postingId: string) => apiClient.get(`/api/admin/postings/${postingId}`),
  },

  // Report management APIs (READ ONLY)
  reports: {
    list: (params: Record<string, unknown>) =>
      apiClient.get("/api/admin/reports", { params }),
    get: (reportId: string) => apiClient.get(`/api/admin/reports/${reportId}`),
  },
};
