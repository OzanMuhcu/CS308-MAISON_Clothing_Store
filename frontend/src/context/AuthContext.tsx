import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import api from "../services/api";
import type { User } from "../types";

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Restore session from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem("user");
    const token = localStorage.getItem("token");
    if (stored && token) {
      try {
        setUser(JSON.parse(stored));
      } catch {
        localStorage.removeItem("user");
        localStorage.removeItem("token");
      }
    }
    setLoading(false);
  }, []);

  const syncGuestCart = useCallback(async () => {
    try {
      const raw = localStorage.getItem("guestCart");
      if (!raw) return;
      const items = JSON.parse(raw);
      if (Array.isArray(items) && items.length > 0) {
        await api.post("/cart/sync", {
          items: items.map((i: any) => ({
            productId: i.productId,
            quantity: i.quantity,
          })),
        });
        localStorage.removeItem("guestCart");
      }
    } catch (err) {
      console.warn("Guest cart sync failed:", err);
    }
  }, []);

  const login = async (email: string, password: string) => {
    const { data } = await api.post("/auth/login", { email, password });
    localStorage.setItem("token", data.token);
    localStorage.setItem("user", JSON.stringify(data.user));
    // CRITICAL ORDERING: sync guest cart BEFORE setting user state.
    // CartContext watches `user` via useEffect and fetches the server cart
    // the moment user changes. If we called setUser first, that fetch would
    // race with the sync request and return an empty cart. By completing
    // the sync first, the server already has the merged items when
    // CartContext eventually fetches.
    await syncGuestCart();
    setUser(data.user);
  };

  const register = async (name: string, email: string, password: string) => {
    const { data } = await api.post("/auth/register", { name, email, password });
    localStorage.setItem("token", data.token);
    localStorage.setItem("user", JSON.stringify(data.user));
    // CRITICAL ORDERING: same as login — sync completes before user state
    // triggers CartContext server-cart fetch. See comment in login().
    await syncGuestCart();
    setUser(data.user);
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    // Note: guest cart persists across logout — user can continue browsing
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be inside AuthProvider");
  return ctx;
}
