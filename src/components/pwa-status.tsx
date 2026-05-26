import { useEffect, useState } from "react";
import { registerSW } from "virtual:pwa-register";
import { toast } from "sonner";

const canUseServiceWorker =
  typeof window !== "undefined" && "serviceWorker" in navigator && window.isSecureContext;

export function PwaStatus() {
  const [online, setOnline] = useState(() =>
    typeof navigator === "undefined" ? true : navigator.onLine,
  );

  useEffect(() => {
    if (!canUseServiceWorker) return;

    const updateServiceWorker = registerSW({
      immediate: true,
      onNeedRefresh() {
        toast("New version available", {
          description: "Reload FitSphere to use the latest app shell.",
          action: {
            label: "Reload",
            onClick: () => updateServiceWorker(true),
          },
          duration: Infinity,
        });
      },
      onOfflineReady() {
        toast.success("FitSphere is ready offline", {
          description:
            "Static app files are cached. Live fitness data still requires a connection.",
        });
      },
      onRegisterError(error) {
        if (import.meta.env.DEV) console.error("Service worker registration failed", error);
      },
    });
  }, []);

  useEffect(() => {
    const handleOnline = () => setOnline(true);
    const handleOffline = () => setOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  if (online) return null;

  return (
    <div
      role="status"
      className="fixed inset-x-3 bottom-3 z-50 mx-auto max-w-md rounded-md border border-warning/30 bg-background px-4 py-3 text-sm text-foreground shadow-elevated"
    >
      <div className="font-medium">You are offline</div>
      <div className="mt-1 text-muted-foreground">
        The app shell will stay available. Live account, workout, payment, and health data needs the
        network.
      </div>
    </div>
  );
}
