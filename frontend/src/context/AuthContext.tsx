/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';

type AuthUser = {
  email: string;
  role: 'customer' | 'sales' | 'product';
};

type AuthContextType = {
  user: AuthUser | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, taxId?: string, homeAddress?: string) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const fallbackAuthContext: AuthContextType = {
  user: null,
  isAuthenticated: false,
  login: async () => {
    throw new Error('AuthProvider is not configured');
  },
  register: async () => {
    throw new Error('AuthProvider is not configured');
  },
  logout: () => {},
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);

  const login = async (email: string, password: string) => {
    if (!email || !password) {
      throw new Error('Email and password are required');
    }

    // Basic in-memory auth placeholder until API integration is added.
    const role: AuthUser['role'] = email.includes('sales')
      ? 'sales'
      : email.includes('product')
      ? 'product'
      : 'customer';

    setUser({ email, role });
  };

  const register = async (name: string, email: string, password: string, taxId?: string, homeAddress?: string) => {
    if (!email || !password || !name) {
      throw new Error('Name, email, and password are required');
    }

    // Basic in-memory registration placeholder until API integration is added.
    const role: AuthUser['role'] = email.includes('sales')
      ? 'sales'
      : email.includes('product')
      ? 'product'
      : 'customer';

    setUser({ email, role });
  };

  const logout = () => {
    setUser(null);
  };

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: user !== null,
      login,
      register,
      logout,
    }),
    [user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  return context ?? fallbackAuthContext;
}
