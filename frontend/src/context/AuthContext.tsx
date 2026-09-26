import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { User, AuthTokens, Role } from '../types/auth';

interface AuthContextType {
  user: User | null;
  tokens: AuthTokens | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; user?: User; error?: string }>;
  quickRoleLogin: (role: Role) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  refreshTokenNow: () => Promise<string | null>;
}


const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_BASE = '/api';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [tokens, setTokens] = useState<AuthTokens | null>(() => {
    const saved = localStorage.getItem('vansetu_tokens');
    return saved ? JSON.parse(saved) : null;
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const handleLogoutClean = () => {
    setUser(null);
    setTokens(null);
    localStorage.removeItem('vansetu_tokens');
  };

  const refreshTokenNow = async (): Promise<string | null> => {
    const saved = localStorage.getItem('vansetu_tokens');
    const activeTokens = saved ? JSON.parse(saved) : tokens;
    if (!activeTokens?.refreshToken) return null;

    try {
      const res = await axios.post(`${API_BASE}/auth/refresh`, {
        refreshToken: activeTokens.refreshToken,
      });

      if (res.data.success) {
        const newTokens = res.data.data;
        setTokens(newTokens);
        localStorage.setItem('vansetu_tokens', JSON.stringify(newTokens));
        return newTokens.accessToken;
      }
    } catch (err) {
      handleLogoutClean();
    }
    return null;
  };

  // Setup Axios Request & Response Interceptors for Auth & Auto-Refresh
  useEffect(() => {
    const reqInterceptor = axios.interceptors.request.use((config) => {
      const saved = localStorage.getItem('vansetu_tokens');
      const activeTokens = saved ? JSON.parse(saved) : tokens;

      if (activeTokens?.accessToken) {
        config.headers = config.headers || {};
        config.headers.Authorization = `Bearer ${activeTokens.accessToken}`;
      }
      return config;
    });

    const resInterceptor = axios.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;
        if (
          error.response?.status === 401 &&
          originalRequest &&
          !originalRequest._retry &&
          !originalRequest.url?.includes('/api/auth/login') &&
          !originalRequest.url?.includes('/api/auth/refresh')
        ) {
          originalRequest._retry = true;
          const newAccessToken = await refreshTokenNow();

          if (newAccessToken) {
            originalRequest.headers = originalRequest.headers || {};
            originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
            return axios(originalRequest);
          }
        }
        return Promise.reject(error);
      }
    );

    return () => {
      axios.interceptors.request.eject(reqInterceptor);
      axios.interceptors.response.eject(resInterceptor);
    };
  }, [tokens]);

  const checkAuth = async () => {
    const saved = localStorage.getItem('vansetu_tokens');
    const activeTokens = saved ? JSON.parse(saved) : tokens;

    if (!activeTokens?.accessToken) {
      setIsLoading(false);
      return;
    }

    try {
      const res = await axios.get(`${API_BASE}/auth/me`);
      if (res.data.success) {
        setUser(res.data.data);
      }
    } catch (err) {
      console.warn('Token verification failed, attempting refresh...');
      const newToken = await refreshTokenNow();
      if (newToken) {
        try {
          const meRes = await axios.get(`${API_BASE}/auth/me`);
          if (meRes.data.success) {
            setUser(meRes.data.data);
          }
        } catch (meErr) {
          handleLogoutClean();
        }
      } else {
        handleLogoutClean();
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const res = await axios.post(`${API_BASE}/auth/login`, { email, password });
      if (res.data.success) {
        const { user: userData, tokens: tokenData } = res.data.data;
        setUser(userData);
        setTokens(tokenData);
        localStorage.setItem('vansetu_tokens', JSON.stringify(tokenData));
        return { success: true, user: userData };
      }
      return { success: false, error: res.data.error || 'Login failed' };
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || 'Authentication error';
      return { success: false, error: errorMsg };
    }
  };


  const quickRoleLogin = async (role: Role) => {
    const roleEmails: Record<Role, string> = {
      CITIZEN: 'citizen@vansetu.in',
      FIELD_OFFICER: 'officer@vansetu.in',
      DISTRICT_ADMIN: 'admin.district@vansetu.in',
      STATE_ADMIN: 'admin.state@vansetu.in',
    };
    await login(roleEmails[role], 'Password123!');
  };

  const logout = async () => {
    const saved = localStorage.getItem('vansetu_tokens');
    const activeTokens = saved ? JSON.parse(saved) : tokens;
    if (activeTokens?.refreshToken) {
      try {
        await axios.post(`${API_BASE}/auth/logout`, { refreshToken: activeTokens.refreshToken });
      } catch (err) {
        console.error('Logout error:', err);
      }
    }
    handleLogoutClean();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        tokens,
        isAuthenticated: !!user,
        isLoading,
        login,
        quickRoleLogin,
        logout,
        checkAuth,
        refreshTokenNow,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
