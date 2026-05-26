import { useEffect, useMemo, useState } from "react";
import { Download, Share2, X } from "lucide-react";
import { Button } from "@/components/ui/button";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

const dismissedKey = "fitsphere-install-dismissed";
const installedKey = "fitsphere-installed";

function isStandalone() {
  if (typeof window === "undefined") return false;

  const navigatorWithStandalone = window.navigator as Navigator & { standalone?: boolean };

  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    window.matchMedia("(display-mode: fullscreen)").matches ||
    navigatorWithStandalone.standalone === true
  );
}

function isIosSafari() {
  if (typeof window === "undefined") return false;

  const userAgent = window.navigator.userAgent;
  const vendor = window.navigator.vendor;
  const isAppleTouchDevice =
    /iPad|iPhone|iPod/.test(userAgent) ||
    (userAgent.includes("Macintosh") && window.navigator.maxTouchPoints > 1);
  const isWebKit = /Safari/.test(userAgent) && /Apple/.test(vendor);
  const isOtherIosBrowser = /CriOS|FxiOS|EdgiOS|OPiOS/.test(userAgent);

  return isAppleTouchDevice && isWebKit && !isOtherIosBrowser;
}

export function PwaInstallPrompt() {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(() => isStandalone());
  const [isPrompting, setIsPrompting] = useState(false);
  const [dismissed, setDismissed] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.sessionStorage.getItem(dismissedKey) === "true";
  });
  const showIosGuidance = useMemo(() => isIosSafari(), []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const syncInstalledState = () => {
      const installed = isStandalone() || window.localStorage.getItem(installedKey) === "true";
      setIsInstalled(installed);
      if (installed) setInstallPrompt(null);
    };

    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      syncInstalledState();
      if (isStandalone() || window.localStorage.getItem(installedKey) === "true") return;
      setInstallPrompt(event as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      window.localStorage.setItem(installedKey, "true");
      setIsInstalled(true);
      setInstallPrompt(null);
    };

    syncInstalledState();
    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const dismiss = () => {
    window.sessionStorage.setItem(dismissedKey, "true");
    setDismissed(true);
  };

  const install = async () => {
    if (!installPrompt || isPrompting) return;

    setIsPrompting(true);
    try {
      await installPrompt.prompt();
      await installPrompt.userChoice;
    } finally {
      setInstallPrompt(null);
      setIsPrompting(false);
    }
  };

  if (isInstalled || dismissed) return null;

  if (installPrompt) {
    return (
      <div
        role="region"
        aria-label="Install FitSphere"
        className="fixed inset-x-3 bottom-3 z-40 mx-auto flex max-w-md items-center gap-3 rounded-md border border-border bg-card px-3 py-3 text-sm text-card-foreground shadow-elevated"
      >
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
          <Download className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="font-medium">Install FitSphere</div>
          <div className="text-xs text-muted-foreground">
            Add the app for quicker access and a standalone workspace.
          </div>
        </div>
        <Button size="sm" onClick={install} disabled={isPrompting}>
          Install App
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 shrink-0"
          onClick={dismiss}
          aria-label="Dismiss install prompt"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  if (showIosGuidance) {
    return (
      <div
        role="note"
        className="fixed inset-x-3 bottom-3 z-40 mx-auto flex max-w-md items-start gap-3 rounded-md border border-border bg-card px-3 py-3 text-sm text-card-foreground shadow-elevated"
      >
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
          <Share2 className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="font-medium">Tap Share → Add to Home Screen</div>
          <div className="text-xs text-muted-foreground">
            iPhone and iPad users can install FitSphere from Safari's share menu.
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 shrink-0"
          onClick={dismiss}
          aria-label="Dismiss install guidance"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return null;
}
