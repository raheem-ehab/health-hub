import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';

interface User {
  id: string;
  email: string;
  name?: string;
  role: 'admin';
  avatar?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string, remember?: boolean) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
}

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
const AuthContext = createContext<AuthContextType | undefined>(undefined);

const normalizeUser = (payload: Partial<User> & { _id?: string }): User => {
  const email = payload.email || '';
  return {
    id: payload.id || (payload as any)._id || '',
    email,
    role: 'admin',
    name: email ? email.split('@')[0] : 'Admin',
    avatar: payload.avatar,
  };
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const clearSession = useCallback(() => {
    setUser(null);
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_user');
    // Legacy storage cleanup
    localStorage.removeItem('emr_user');
    sessionStorage.removeItem('emr_user');
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('admin_token');
    const storedUser = localStorage.getItem('admin_user');

    if (storedUser) {
      try {
        const parsed = JSON.parse(storedUser);
        setUser(parsed);
      } catch {
        clearSession();
      }
    }

    if (!token) {
      setIsLoading(false);
      return;
    }

    const verifySession = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/auth/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          clearSession();
          return;
        }

        const data = await response.json();
        const normalized = normalizeUser(data);
        setUser(normalized);
        localStorage.setItem('admin_user', JSON.stringify(normalized));
      } catch {
        clearSession();
      } finally {
    setIsLoading(false);
      }
    };

    verifySession();
  }, [clearSession]);

  const login = async (email: string, password: string, _remember?: boolean): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        clearSession();
        return { success: false, error: data.message || 'Invalid email or password' };
      }

      const normalized = normalizeUser(data.user);
      localStorage.setItem('admin_token', data.token);
      localStorage.setItem('admin_user', JSON.stringify(normalized));

      // Token must live in localStorage to keep protected routes working
      setUser(normalized);
      return { success: true };
    } catch (error: any) {
      clearSession();
      return { success: false, error: error?.message || 'Unable to login. Please try again.' };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    clearSession();
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      isAuthenticated: !!user, 
      isLoading, 
      login, 
      logout 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
