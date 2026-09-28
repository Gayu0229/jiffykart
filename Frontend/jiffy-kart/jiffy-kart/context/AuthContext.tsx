import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { useNavigation, ViewType } from './NavigationContext';
import { ApiService } from '../services/apiService';

interface AuthContextType {
  isLoggedIn: boolean;
  user: any | null;
  login: (redirectView?: ViewType, redirectParams?: any, credentials?: any, userData?: any) => Promise<void>;
  logout: () => void;
  updateUser: (userData: any) => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const { navigate } = useNavigation();

  useEffect(() => {
    const storedUser = localStorage.getItem('jiffykart_user');
    const storedToken = localStorage.getItem('jiffykart_token');

    if (storedUser && storedToken) {
      try {
        const parsedUser = JSON.parse(storedUser);
        console.log("🔄 [AuthContext] Restoring session for user:", parsedUser.name);
        setUser(parsedUser);
      } catch (error) {
        console.error("❌ [AuthContext] Failed to restore session:", error);
        localStorage.removeItem('jiffykart_user');
        localStorage.removeItem('jiffykart_token');
      }
    }
  }, []);

  const login = async (redirectView?: ViewType, redirectParams?: any, credentials?: any, userData?: any) => {
    try {
      console.log("🔑 [AuthContext] Login started. redirectView:", redirectView, "hasUserData:", !!userData);

      if (userData) {
        setUser(userData);
      } else {
        const data = await ApiService.login(credentials);
        setUser(data.user);
      }

      if (redirectView) {
        console.log("👉 [AuthContext] Navigating to requested view:", redirectView);
        navigate(redirectView, redirectParams);
      } else {
        console.log("👉 [AuthContext] No redirect specified, navigating to profile");
        navigate('profile');
      }
    } catch (error) {
      console.error("❌ [AuthContext] Authentication failed", error);
      throw error;
    }
  };

  const logout = () => {
    ApiService.logout();
    setUser(null);
    navigate('home');
  };

  const updateUser = (userData: any) => {
    setUser(userData);
    ApiService._saveSession(ApiService.getAuthToken() || '', userData);
  };

  return (
    <AuthContext.Provider value={{
      isLoggedIn: !!user,
      user,
      login,
      logout,
      updateUser,
      loading
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};