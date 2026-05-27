import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import type { UserRole } from "./types";
import { ApiError, api, refreshAccessToken, setAccessToken } from "./api";

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
  login: (email: string, password: string, role: UserRole, rememberMe?: boolean) => Promise<AuthUser>;
  signupTrainer: (name: string, email: string, password: string) => Promise<AuthUser>;
  updateMe: (input: { name?: string; email?: string }) => Promise<AuthUser>;
  restoreSession: () => Promise<void>;
  logout: () => Promise<void>;
  logoutAll: () => Promise<void>;
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

  useEffect(() => {
    if (status !== "offline") return;
    const handleOnline = () => {
      restoreSession();
    };
    window.addEventListener("online", handleOnline);
    return () => window.removeEventListener("online", handleOnline);
  }, [status]);

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
      if (error instanceof ApiError && error.status === 0) {
        setStatus("offline");
        return;
      }
      setAccessToken(null);
      setUser(null);
      setStatus("unauthenticated");
    }
  };

  const login = async (email: string, password: string, role: UserRole, rememberMe = false) => {
    const data = await api<{ user: AuthUser; accessToken: string }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password, role, rememberMe }),
    });
    setAccessToken(data.accessToken);
    const nextUser = normalizeUser(data.user);
    setUser(nextUser);
    setStatus("authenticated");
    return nextUser;
  };

  const signupTrainer = async (name: string, email: string, password: string) => {
    const data = await api<{ user: AuthUser; trainer: unknown; accessToken: string }>("/auth/trainer-signup", {
      method: "POST",
      body: JSON.stringify({ name, email, password }),
    });
    setAccessToken(data.accessToken);
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

  const clearLocalSession = () => {
    setAccessToken(null);
    setUser(null);
    setStatus("unauthenticated");
    queryClient.clear();
  };

  const logout = async () => {
    try {
      await api("/auth/logout", { method: "POST" });
    } catch {
      // Local logout should still complete if the network is unavailable.
    } finally {
      clearLocalSession();
    }
  };

  const logoutAll = async () => {
    try {
      await api("/auth/logout-all", { method: "POST" });
    } catch {
      // Preserve user intent locally even when the server call cannot be confirmed.
    } finally {
      clearLocalSession();
    }
  };

  return (
    <AuthContext.Provider
      value={{ user, loading, status, restoreSession, login, signupTrainer, updateMe, logout, logoutAll }}
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
