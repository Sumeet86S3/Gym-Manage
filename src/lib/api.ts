const API_BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:4000/api/v1";
const LEGACY_TOKEN_KEY = "fitsphere_access_token";
let accessToken: string | null = null;
let refreshPromise: Promise<string | null> | null = null;

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
  return accessToken;
}

export function setAccessToken(token: string | null) {
  accessToken = token;
  if (typeof window !== "undefined") window.localStorage.removeItem(LEGACY_TOKEN_KEY);
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
  } catch (error) {
    if (isOffline()) {
      throw new ApiError("You appear to be offline. Reconnect to load live FitSphere data.", 0);
    }

    throw error;
  }

  if (response.status === 204) return null as T;

  const payload = await response.json().catch(() => null);
  if (response.status === 401 && allowRefresh && path !== "/auth/refresh" && !isOffline()) {
    const refreshedToken = await refreshAccessToken();
    if (refreshedToken) return request<T>(path, options, false);
  }

  if (!response.ok) {
    throw new ApiError(payload?.message ?? "Request failed", response.status, payload?.details);
  }

  return (payload as ApiEnvelope<T>).data;
}

export async function refreshAccessToken() {
  if (isOffline()) return null;

  if (!refreshPromise) {
    refreshPromise = request<{ user: unknown; accessToken: string }>(
      "/auth/refresh",
      {
        method: "POST",
      },
      false,
    )
      .then((data) => {
        setAccessToken(data.accessToken);
        return data.accessToken;
      })
      .catch(() => {
        setAccessToken(null);
        return null;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }

  return refreshPromise;
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

function isOffline() {
  return typeof navigator !== "undefined" && !navigator.onLine;
}
