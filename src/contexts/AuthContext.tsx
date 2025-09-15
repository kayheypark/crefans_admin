'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useRef } from 'react';
import { adminAuthAPI } from '@/lib/api/admin-auth';

interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: string;
  last_login: string | null;
  cognito: {
    username: string;
    sub: string;
    email: string;
    name: string;
  };
}

interface AuthContextType {
  user: AdminUser | null | undefined;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  // null: 로그아웃, AdminUser: 로그인, undefined: 아직 파싱 전(로딩)
  const [user, setUser] = useState<AdminUser | null | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const initRef = useRef(false);

  const initializeUser = useCallback(async () => {
    // Prevent multiple initialization calls in StrictMode
    if (initRef.current) return;
    initRef.current = true;

    try {
      setIsLoading(true);
      // Try to get current admin from server using cookies
      const response = await adminAuthAPI.getMe();
      if (response.success && response.data?.admin) {
        setUser(response.data.admin);
      } else {
        setUser(null);
      }
    } catch (error) {
      console.log('Admin authentication check failed:', error);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // Check for existing authentication on app load
    initializeUser();
  }, [initializeUser]);

  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true);

      // Use real Cognito authentication with admin role verification
      const response = await adminAuthAPI.signin(email, password);

      if (response.success && response.data?.admin) {
        // Get full admin info after successful login
        const adminResponse = await adminAuthAPI.getMe();
        if (adminResponse.success && adminResponse.data?.admin) {
          setUser(adminResponse.data.admin);
        } else {
          throw new Error('Failed to get admin information');
        }
      } else {
        throw new Error(response.message || 'Login failed');
      }
    } catch (error: unknown) {
      console.error('Admin login failed:', error);
      setUser(null);
      const errorMessage = error instanceof Error
        ? error.message
        : (error as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Login failed';
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await adminAuthAPI.signout();
    } catch (error) {
      console.error('Logout API call failed:', error);
    } finally {
      setUser(null);
      // Redirect to login page after logout
      if (typeof window !== 'undefined') {
        window.location.replace('/login');
      }
    }
  };

  const value: AuthContextType = {
    user,
    isLoading,
    login,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};