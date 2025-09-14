import axios from "axios";

// Get API URL from environment
const getApiUrl = () => {
  return process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
};

// Admin authentication API functions
export const adminAuthAPI = {
  // Admin login
  signin: async (email: string, password: string) => {
    const response = await axios.post(
      `${getApiUrl()}/admin/auth/signin`,
      { email, password },
      { withCredentials: true }
    );
    return response.data;
  },

  // Admin logout
  signout: async () => {
    const response = await axios.post(
      `${getApiUrl()}/admin/auth/signout`,
      {},
      { withCredentials: true }
    );
    return response.data;
  },

  // Get current admin info
  getMe: async () => {
    const response = await axios.get(`${getApiUrl()}/admin/auth/me`, {
      withCredentials: true,
    });
    return response.data;
  },
};