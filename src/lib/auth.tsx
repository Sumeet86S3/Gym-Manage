import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { UserRole } from "./mock-data";

interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  approved: boolean;
}

interface AuthContextValue {
  user: AuthUser | null;
  login: (email: string, password: string, role: UserRole) => void;
  signupTrainer: (name: string, email: string, password: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const STORAGE_KEY = "fitstudio_demo_user";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        setUser(JSON.parse(raw));
      } catch {
        /* ignore */
      }
    }
  }, []);

  const persist = (u: AuthUser | null) => {
    setUser(u);
    if (typeof window !== "undefined") {
      if (u) window.localStorage.setItem(STORAGE_KEY, JSON.stringify(u));
      else window.localStorage.removeItem(STORAGE_KEY);
    }
  };

  const login = (email: string, _password: string, role: UserRole) => {
    const name =
      role === "admin" ? "Avery Stone" : role === "trainer" ? "Alex Rivera" : "Olivia Bennett";
    persist({ id: `${role}-1`, name, email, role, approved: true });
  };

  const signupTrainer = (name: string, email: string, _password: string) => {
    persist({ id: "trainer-pending", name, email, role: "trainer", approved: false });
  };

  const logout = () => persist(null);

  return (
    <AuthContext.Provider value={{ user, login, signupTrainer, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
