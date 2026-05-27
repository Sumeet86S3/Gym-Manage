type TelemetryLevel = "info" | "warn" | "error";
const TELEMETRY_URL = `${import.meta.env.VITE_API_URL ?? "http://localhost:4000/api/v1"}/telemetry`;

interface TelemetryEvent {
  level: TelemetryLevel;
  area: "auth" | "api" | "service-worker" | "route" | "render";
  message: string;
  status?: number;
  path?: string;
  error?: unknown;
}

const SENSITIVE_KEYS = ["token", "authorization", "password", "secret", "health", "payment"];

export function trackEvent(event: TelemetryEvent) {
  const payload = sanitize({
    level: event.level,
    area: event.area,
    message: event.message,
    status: event.status,
    path: event.path,
    error: errorMessage(event.error),
    at: new Date().toISOString(),
  });

  if (import.meta.env.DEV) {
    const method = event.level === "error" ? console.error : event.level === "warn" ? console.warn : console.info;
    method("[telemetry]", payload);
    return;
  }

  const body = JSON.stringify(payload);
  if (typeof navigator !== "undefined" && navigator.sendBeacon) {
    navigator.sendBeacon(TELEMETRY_URL, new Blob([body], { type: "application/json" }));
  }
}

export function installGlobalTelemetry() {
  if (typeof window === "undefined") return;
  window.addEventListener("error", (event) => {
    trackEvent({
      level: "error",
      area: "render",
      message: "Unhandled frontend error",
      error: event.error ?? event.message,
      path: window.location.pathname,
    });
  });
  window.addEventListener("unhandledrejection", (event) => {
    trackEvent({
      level: "error",
      area: "api",
      message: "Unhandled promise rejection",
      error: event.reason,
      path: window.location.pathname,
    });
  });
}

function errorMessage(error: unknown) {
  if (!error) return undefined;
  if (error instanceof Error) return error.message;
  return String(error);
}

function sanitize<T>(value: T): T {
  return JSON.parse(
    JSON.stringify(value, (key, nested) => {
      if (SENSITIVE_KEYS.some((sensitive) => key.toLowerCase().includes(sensitive))) {
        return "[redacted]";
      }
      return nested;
    }),
  );
}
