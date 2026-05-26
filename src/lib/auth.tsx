import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import type { UserRole } from "./types";
import { ApiError, api, refreshAccessToken, setAccessToken, setRefreshToken } from "./api";

interface AuthUser {
  id: string;
  profileId?: string | null;
  name: string;
  email: string;
  role: UserRole;
  approved: boolean;
  approvalStatus?: "Pending" | "Approved" | "Rejected";
  trainer?: { id: string } | null;
  client?: { id: string } | null;
}

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  status: "restoring" | "authenticated" | "unauthenticated" | "offline";
  login: (email: string, password: string, role: UserRole) => Promise<AuthUser>;
  signupTrainer: (name: string, email: string, password: string) => Promise<AuthUser>;
  updateMe: (input: { name?: string; email?: string }) => Promise<AuthUser>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [status, setStatus] = useState<AuthContextValue["status"]>("restoring");
  const loading = status === "restoring";

  useEffect(() => {
    restoreSession();
  }, []);

  const restoreSession = async () => {
    setStatus("restoring");
    try {
      const token = await refreshAccessToken({ throwOnFailure: true });
      if (!token) {
        setUser(null);
        setStatus("unauthenticated");
        return;
      }
      const data = await api<AuthUser>("/auth/me");
      setUser(normalizeUser(data));
      setStatus("authenticated");
    } catch (error) {
      setAccessToken(null);
      setUser(null);
      setStatus(error instanceof ApiError && error.status === 0 ? "offline" : "unauthenticated");
    }
  };

  const login = async (email: string, password: string, role: UserRole) => {
    const data = await api<{ user: AuthUser; accessToken: string; refreshToken?: string }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password, role }),
    });
    setAccessToken(data.accessToken);
    if (data.refreshToken) setRefreshToken(data.refreshToken);
    const nextUser = normalizeUser(data.user);
    setUser(nextUser);
    setStatus("authenticated");
    return nextUser;
  };

  const signupTrainer = async (name: string, email: string, password: string) => {
    const data = await api<{ user: AuthUser; trainer: unknown; accessToken: string; refreshToken?: string }>("/auth/trainer-signup", {
      method: "POST",
      body: JSON.stringify({ name, email, password }),
    });
    setAccessToken(data.accessToken);
    if (data.refreshToken) setRefreshToken(data.refreshToken);
    const nextUser = normalizeUser(data.user);
    setUser(nextUser);
    setStatus("authenticated");
    return nextUser;
  };

  const updateMe = async (input: { name?: string; email?: string }) => {
    const data = await api<AuthUser>("/users/me", {
      method: "PATCH",
      body: JSON.stringify(input),
    });
    const nextUser = normalizeUser(data);
    setUser(nextUser);
    setStatus("authenticated");
    return nextUser;
  };

  const logout = () => {
    apiRefreshToken(null);
    set("/auth/logout", { method: "POST" }).catch(() => undefined);
    setAccessToken(null);
    setUser(null);
    setStatus("unauthenticated");
    queryClient.clear();
  };

  return (
    <AuthContext.Provider
      value={{ user, loading, status, login, signupTrainer, updateMe, logout }}
    >
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
    profileId: user.profileId ?? user.client?.id ?? user.trainer?.id ?? null,
    approved: user.approved ?? user.approvalStatus === "Approved",
  };
}
