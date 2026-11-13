import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile, authService } from '../services/authService';

interface AuthContextType {
  user: UserProfile | null;
  token: string | null;
  loading: boolean;
  login: (token: string, user: UserProfile) => void;
  logout: () => void;
  updateUser: (user: UserProfile) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('talentflow_token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('talentflow_token');
      const storedUser = localStorage.getItem('talentflow_user');

      if (storedToken && storedUser) {
        try {
          setUser(JSON.parse(storedUser));
          // Refresh user data from API
          const data = await authService.getCurrentUser();
          if (data.success && data.user) {
            setUser(data.user);
            localStorage.setItem('talentflow_user', JSON.stringify(data.user));
          }
        } catch (err) {
          console.warn('[Auth] Token validation failed:', err);
          logout();
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = (newToken: string, newUser: UserProfile) => {
    localStorage.setItem('talentflow_token', newToken);
    localStorage.setItem('talentflow_user', JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
  };

  const logout = () => {
    authService.logout();
    setToken(null);
    setUser(null);
  };

  const updateUser = (updated: UserProfile) => {
    setUser(updated);
    localStorage.setItem('talentflow_user', JSON.stringify(updated));
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, updateUser }}>
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

