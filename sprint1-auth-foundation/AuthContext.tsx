import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import api from '../services/api';
import { User, GuestCartItem } from '../types';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, taxId?: string, homeAddress?: string) => Promise<void>;
  logout: () => void;
  guestCart: GuestCartItem[];
  addToGuestCart: (item: GuestCartItem) => void;
  removeFromGuestCart: (productId: number) => void;
  updateGuestCartQty: (productId: number, qty: number) => void;
  clearGuestCart: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function loadGuestCart(): GuestCartItem[] {
  try { return JSON.parse(localStorage.getItem('guestCart') || '[]'); } catch { return []; }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [guestCart, setGuestCart] = useState<GuestCartItem[]>(loadGuestCart());

  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (stored) { try { setUser(JSON.parse(stored)); } catch {} }
    setLoading(false);
  }, []);

  useEffect(() => { localStorage.setItem('guestCart', JSON.stringify(guestCart)); }, [guestCart]);

  const syncGuestCartToServer = async () => {
    const items = loadGuestCart();
    if (items.length > 0) {
      try {
        await api.post('/cart/sync', { items: items.map(i => ({ productId: i.productId, quantity: i.quantity })) });
        localStorage.removeItem('guestCart');
        setGuestCart([]);
      } catch (e) { console.error('Failed to sync guest cart', e); }
    }
  };

  const login = async (email: string, password: string) => {
    const { data } = await api.post('/auth/login', { email, password });
    localStorage.setItem('accessToken', data.accessToken);
    localStorage.setItem('refreshToken', data.refreshToken);
    localStorage.setItem('user', JSON.stringify(data.user));
    setUser(data.user);
    if (data.user.role === 'customer') await syncGuestCartToServer();
  };

  const register = async (name: string, email: string, password: string, taxId?: string, homeAddress?: string) => {
    const { data } = await api.post('/auth/register', { name, email, password, taxId, homeAddress });
    localStorage.setItem('accessToken', data.accessToken);
    localStorage.setItem('refreshToken', data.refreshToken);
    localStorage.setItem('user', JSON.stringify(data.user));
    setUser(data.user);
    if (data.user.role === 'customer') await syncGuestCartToServer();
  };

  const logout = () => {
    api.post('/auth/logout').catch(() => {});
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    setUser(null);
  };

  const addToGuestCart = (item: GuestCartItem) => {
    setGuestCart(prev => {
      const existing = prev.find(i => i.productId === item.productId);
      if (existing) return prev.map(i => i.productId === item.productId ? { ...i, quantity: Math.min(i.quantity + item.quantity, i.stock) } : i);
      return [...prev, item];
    });
  };

  const removeFromGuestCart = (productId: number) => setGuestCart(prev => prev.filter(i => i.productId !== productId));
  const updateGuestCartQty = (productId: number, qty: number) => setGuestCart(prev => prev.map(i => i.productId === productId ? { ...i, quantity: qty } : i));
  const clearGuestCart = () => { setGuestCart([]); localStorage.removeItem('guestCart'); };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, guestCart, addToGuestCart, removeFromGuestCart, updateGuestCartQty, clearGuestCart }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
