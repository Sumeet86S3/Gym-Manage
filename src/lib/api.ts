const API_BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:4000/api/v1";
const LEGACY_TOKEN_KEY = "fitsphere_access_token";
const SESSION_TOKEN_KEY = "fitsphere_session_token";
const REFRESH_TOKEN_KEY = "fitsphere_refresh_token";
let accessToken: string | null = null;
let refreshToken: string | null = null;
let refreshPromise: Promise<string | null> | null = null;
let refreshError: unknown = null;

interface ApiEnvelope<T> {
  success: boolean;
  message: string;
  data: T;
}

export class ApiError extends Error {
  status: number;
  details?: unknown;

  constructor(message: string, status: number, details?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.details = details;
  }
}

export function getAccessToken() {
  // Return in-memory token if available
  if (accessToken) return accessToken;
  
  // Fallback to sessionStorage (useful for page reloads)
  if (typeof window !== "undefined") {
    const storedToken = window.sessionStorage.getItem(SESSION_TOKEN_KEY);
    if (storedToken) {
      accessToken = storedToken;
      return storedToken;
    }
  }
  
  return null;
}

export function getRefreshToken() {
  if (refreshToken) return refreshToken;
  
  if (typeof window !== "undefined") {
    // Check localStorage first (persists across app closures for PWA)
    const storedToken = window.localStorage.getItem(REFRESH_TOKEN_KEY);
    if (storedToken) {
      refreshToken = storedToken;
      return storedToken;
    }
  }
  
  return null;
}

export function setAccessToken(token: string | null) {
  accessToken = token;
  if (typeof window !== "undefined") {
    window.localStorage.removeItem(LEGACY_TOKEN_KEY);
    if (token) {
      // Store in sessionStorage for recovery on page reload
      window.sessionStorage.setItem(SESSION_TOKEN_KEY, token);
    } else {
      // Clear sessionStorage when logging out
      window.sessionStorage.removeItem(SESSION_TOKEN_KEY);
    }
  }
}

export function setRefreshToken(token: string | null) {
  refreshToken = token;
  if (typeof window !== "undefined") {
    if (token) {
      // Store in localStorage so it persists across app closures (PWA support)
      window.localStorage.setItem(REFRESH_TOKEN_KEY, token);
    } else {
      // Clear localStorage when logging out
      window.localStorage.removeItem(REFRESH_TOKEN_KEY);
    }
  }
}

export async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  return request<T>(path, options, true);
}

async function request<T>(
  path: string,
  options: RequestInit = {},
  allowRefresh: boolean,
): Promise<T> {
  const token = getAccessToken();
  const headers = new Headers(options.headers);
  if (!headers.has("Content-Type") && options.body) headers.set("Content-Type", "application/json");
  if (token) headers.set("Authorization", `Bearer ${token}`);

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers,
      credentials: "include",
      cache: "no-store",
    });
  } catch {
    throw new ApiError("Unable to reach FitSphere. Reconnect to load live data.", 0);
  }

  if (response.status === 204) return null as T;

  const payload = await response.json().catch(() => null);
  if (response.status === 401 && allowRefresh && path !== "/auth/refresh") {
    const refreshedToken = await refreshAccessToken();
    if (refreshedToken) return request<T>(path, options, false);
  }

  if (!response.ok) {
    throw new ApiError(payload?.message ?? "Request failed", response.status, payload?.details);
  }

  return (payload as ApiEnvelope<T>).data;
}

export async function refreshAccessToken(options: { throwOnFailure?: boolean } = {}) {
  if (!refreshPromise) {
    refreshError = null;
    refreshPromise = request<{ user: unknown; accessToken: string; refreshToken?: string }>(
      "/auth/refresh",
      {
        method: "POST",
        body: JSON.stringify({ refreshToken: getRefreshToken() }),
      },
      false,
    )
      .then((data) => {
        setAccessToken(data.accessToken);
        // Update refresh token if backend sends a new one (for token rotation)
        if (data.refreshToken) {
          setRefreshToken(data.refreshToken);
        }
        return data.accessToken;
      })
      .catch((error) => {
        refreshError = error;
        setAccessToken(null);
        setRefreshToken(null);
        return null;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }

  const token = await refreshPromise;
  if (!token && options.throwOnFailure) throw refreshError ?? new ApiError("Unable to restore session", 401);
  return token;
}

export function toCurrency(amount: number) {
  return `₹${amount.toLocaleString("en-IN")}`;
}

export function formatDateLabel(value?: string | null) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" });
}
