import { trackEvent } from "./telemetry";

const API_BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:4000/api/v1";
const LEGACY_TOKEN_KEY = "fitsphere_access_token";
const REFRESH_TOKEN_KEY = "fitsphere_refresh_token";
const REQUEST_TIMEOUT_MS = 15_000;
let accessToken: string | null = null;
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
  return accessToken;
}

export function setAccessToken(token: string | null) {
  accessToken = token;
  if (typeof window !== "undefined") {
    window.localStorage.removeItem(LEGACY_TOKEN_KEY);
    window.localStorage.removeItem(REFRESH_TOKEN_KEY);
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
  if (typeof navigator !== "undefined" && !navigator.onLine) {
    trackEvent({ level: "warn", area: "api", message: "Request blocked while offline", path });
    throw new ApiError("You are offline. Reconnect to continue securely.", 0);
  }

  const token = getAccessToken();
  const headers = new Headers(options.headers);
  if (!headers.has("Content-Type") && options.body) headers.set("Content-Type", "application/json");
  if (token) headers.set("Authorization", `Bearer ${token}`);

  let response: Response;
  const timeoutController = new AbortController();
  const timeoutId = window.setTimeout(() => timeoutController.abort(), REQUEST_TIMEOUT_MS);
  const signal = mergeSignals(options.signal, timeoutController.signal);

  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers,
      credentials: "include",
      cache: "no-store",
      signal,
    });
  } catch (error) {
    if (timeoutController.signal.aborted) {
      trackEvent({ level: "warn", area: "api", message: "Network request timed out", path });
      throw new ApiError("FitSphere took too long to respond. Please try again.", 408);
    }
    trackEvent({ level: "warn", area: "api", message: "Network request failed", path, error });
    throw new ApiError("Unable to reach FitSphere. Reconnect to load live data.", 0);
  } finally {
    window.clearTimeout(timeoutId);
  }

  if (response.status === 204) return null as T;

  const payload = await response.json().catch(() => null);
  if (response.status === 401 && allowRefresh && path !== "/auth/refresh") {
    const refreshedToken = await refreshAccessToken();
    if (refreshedToken) return request<T>(path, options, false);
  }

  if (!response.ok) {
    trackEvent({
      level: response.status >= 500 ? "error" : "warn",
      area: path.startsWith("/auth") ? "auth" : "api",
      message: "API request failed",
      status: response.status,
      path,
    });
    throw new ApiError(payload?.message ?? "Request failed", response.status, payload?.details);
  }

  return (payload as ApiEnvelope<T>).data;
}

export async function refreshAccessToken(options: { throwOnFailure?: boolean } = {}) {
  if (!refreshPromise) {
    refreshError = null;
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
      .catch((error) => {
        refreshError = error;
        if (!(error instanceof ApiError && error.status === 0)) {
          setAccessToken(null);
        }
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

function mergeSignals(...signals: Array<AbortSignal | null | undefined>) {
  const activeSignals = signals.filter(Boolean) as AbortSignal[];
  if (activeSignals.length === 0) return undefined;
  if (activeSignals.length === 1) return activeSignals[0];

  const controller = new AbortController();
  const abort = () => controller.abort();

  for (const signal of activeSignals) {
    if (signal.aborted) {
      controller.abort();
      break;
    }
    signal.addEventListener("abort", abort, { once: true });
  }

  return controller.signal;
}
