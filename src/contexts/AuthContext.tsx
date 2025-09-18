'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react';
import { adminAuthAPI } from '@/lib/api/admin-auth';
import { isAuthTokenExpired, getAuthTimeUntilExpiryFormatted, shouldRefreshToken, parseAdminToken } from '@/utils/auth';
import { AdminLogoutModal } from '@/components/auth/AdminLogoutModal';

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
  refreshUser: () => Promise<void>;
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
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const tokenCheckIntervalRef = useRef<NodeJS.Timeout>();

  // 초기 사용자 로딩
  useEffect(() => {
    const initializeUser = async () => {
      try {
        const response = await adminAuthAPI.getMe();
        if (response.success && response.data?.admin) {
          setUser(response.data.admin);
          setIsLoading(false);
          return;
        }
      } catch {
        console.log('Server admin info fetch failed, falling back to token parsing');
      }

      // 서버 요청 실패 시 토큰에서 파싱
      const tokenData = parseAdminToken();
      if (tokenData) {
        // 기본 구조로 사용자 설정 (서버에서 다시 가져와야 함)
        setUser({
          id: '',
          name: String(tokenData.name || ''),
          email: String(tokenData.email || ''),
          role: 'admin',
          last_login: null,
          cognito: {
            username: String(tokenData.preferred_username || ''),
            sub: String(tokenData.sub || ''),
            email: String(tokenData.email || ''),
            name: String(tokenData.name || ''),
          },
        });
      } else {
        setUser(null);
      }
      setIsLoading(false);
    };

    initializeUser();
  }, []);

  // 토큰 만료 체크
  useEffect(() => {
    if (user) {
      const checkTokenExpiry = async () => {
        if (isAuthTokenExpired()) {
          // 페이지가 보이고 있는 경우에만 토큰 갱신 시도
          if (document.visibilityState === 'visible') {
            console.log('[Admin] Token expired, attempting refresh...');
            try {
              await adminAuthAPI.refreshToken();
              console.log('[Admin] Token refreshed successfully');
              await refreshUser();
              return;
            } catch (error) {
              console.error('[Admin] Token refresh failed:', error);
            }
          }

          // 페이지가 숨겨져 있거나 리프레시 실패 시 로그아웃
          setShowLogoutModal(true);
          logout();
          return;
        }

        // 토큰이 4분 50초 이하로 남은 경우 리프레시 시도
        if (shouldRefreshToken()) {
          if (document.visibilityState === 'visible') {
            const timeFormatted = getAuthTimeUntilExpiryFormatted();
            console.log(`[Admin] Token expires in ${timeFormatted}, attempting refresh...`);
            try {
              await adminAuthAPI.refreshToken();
              console.log('[Admin] Token refreshed successfully');
              await refreshUser();
              return;
            } catch (error) {
              console.error('[Admin] Token refresh failed:', error);
              setShowLogoutModal(true);
              logout();
              return;
            }
          }
        }

        // 토큰 만료까지 남은 시간 확인
        const timeFormatted = getAuthTimeUntilExpiryFormatted();
        console.log("[Admin] Token expires in:", timeFormatted);
      };

      // 즉시 한 번 체크
      checkTokenExpiry();

      // 30초마다 토큰 만료 체크
      tokenCheckIntervalRef.current = setInterval(checkTokenExpiry, 30000);

      // Page Visibility 이벤트 리스너 추가
      const handleVisibilityChange = () => {
        if (document.visibilityState === 'visible') {
          console.log('[Admin] Page became visible, checking token status...');
          checkTokenExpiry();
        }
      };

      document.addEventListener('visibilitychange', handleVisibilityChange);

      // 컴포넌트 언마운트시 정리
      return () => {
        if (tokenCheckIntervalRef.current) {
          clearInterval(tokenCheckIntervalRef.current);
        }
        document.removeEventListener('visibilitychange', handleVisibilityChange);
      };
    } else {
      // 사용자가 로그아웃되면 인터벌 정리
      if (tokenCheckIntervalRef.current) {
        clearInterval(tokenCheckIntervalRef.current);
      }
    }
  }, [user]);

  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true);

      const response = await adminAuthAPI.signin(email, password);

      if (response.success && response.data?.admin) {
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
    }

    setUser(null);
    // 토큰 체크 인터벌 정리
    if (tokenCheckIntervalRef.current) {
      clearInterval(tokenCheckIntervalRef.current);
    }
  };

  const refreshUser = async () => {
    try {
      console.log("=== refreshUser Debug (Admin) ===");
      const response = await adminAuthAPI.getMe();
      console.log("API Response:", response);

      if (response.success && response.data?.admin) {
        console.log("Setting new admin data:", {
          name: response.data.admin.name,
          email: response.data.admin.email,
        });
        setUser(response.data.admin);
      }
      console.log("============================");
    } catch (error) {
      console.error("Failed to refresh admin info:", error);
      // 실패하면 토큰에서 파싱
      const tokenData = parseAdminToken();
      if (tokenData) {
        setUser({
          id: '',
          name: String(tokenData.name || ''),
          email: String(tokenData.email || ''),
          role: 'admin',
          last_login: null,
          cognito: {
            username: String(tokenData.preferred_username || ''),
            sub: String(tokenData.sub || ''),
            email: String(tokenData.email || ''),
            name: String(tokenData.name || ''),
          },
        });
      } else {
        setUser(null);
      }
    }
  };

  const handleLogoutModalClose = () => {
    setShowLogoutModal(false);
    // 로그인 페이지로 리다이렉트
    if (typeof window !== 'undefined') {
      window.location.replace('/login');
    }
  };

  const value: AuthContextType = {
    user,
    isLoading,
    login,
    logout,
    refreshUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
      <AdminLogoutModal
        isVisible={showLogoutModal}
        onClose={handleLogoutModalClose}
      />
    </AuthContext.Provider>
  );
};