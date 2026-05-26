import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import type { UserRole } from "./types";
import { api, refreshAccessToken, setAccessToken } from "./api";

interface AuthUser {
  id: string;
  profileId?: string | null;
  name: string;
  email: string;
  role: UserRole;
  approved: boolean;
  approvalStatus?: "Pending" | "Approved" | "Rejected";
}

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, password: string, role: UserRole) => Promise<AuthUser>;
  signupTrainer: (name: string, email: string, password: string) => Promise<AuthUser>;
  updateMe: (input: { name?: string; email?: string }) => Promise<AuthUser>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    restoreSession();
  }, []);

  const restoreSession = async () => {
    setLoading(true);
    try {
      const token = await refreshAccessToken();
      if (!token) {
        setUser(null);
        return;
      }
      const data = await api<AuthUser>("/auth/me");
      setUser(normalizeUser(data));
    } catch {
      setAccessToken(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string, role: UserRole) => {
    const data = await api<{ user: AuthUser; accessToken: string }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password, role }),
    });
    setAccessToken(data.accessToken);
    const nextUser = normalizeUser(data.user);
    setUser(nextUser);
    return nextUser;
  };

  const signupTrainer = async (name: string, email: string, password: string) => {
    const data = await api<{ user: AuthUser; accessToken: string }>("/auth/trainer-signup", {
      method: "POST",
      body: JSON.stringify({ name, email, password }),
    });
    setAccessToken(data.accessToken);
    const nextUser = normalizeUser(data.user);
    setUser(nextUser);
    return nextUser;
  };

  const updateMe = async (input: { name?: string; email?: string }) => {
    const data = await api<AuthUser>("/users/me", {
      method: "PATCH",
      body: JSON.stringify(input),
    });
    const nextUser = normalizeUser(data);
    setUser(nextUser);
    return nextUser;
  };

  const logout = () => {
    api("/auth/logout", { method: "POST" }).catch(() => undefined);
    setAccessToken(null);
    setUser(null);
    queryClient.clear();
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, signupTrainer, updateMe, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}

function normalizeUser(user: AuthUser): AuthUser {
  return {
    ...user,
    approved: user.approved ?? user.approvalStatus === "Approved",
  };
}
