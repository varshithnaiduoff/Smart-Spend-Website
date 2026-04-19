import { useEffect, useMemo, useState } from "react";
import { Download, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

const DISMISS_KEY = "smart-spend-pwa-install-dismissed";

const isMobileDevice = () => /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

const isStandalone = () =>
  window.matchMedia("(display-mode: standalone)").matches ||
  (window.navigator as Navigator & { standalone?: boolean }).standalone === true;

const isIosSafari = () => {
  const ua = navigator.userAgent;
  const isIos = /iPhone|iPad|iPod/i.test(ua);
  const isSafari = /Safari/i.test(ua) && !/CriOS|FxiOS|EdgiOS/i.test(ua);
  return isIos && isSafari;
};

const PwaInstallPrompt = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [open, setOpen] = useState(false);
  const [iosHelp, setIosHelp] = useState(false);

  const dismissed = useMemo(() => localStorage.getItem(DISMISS_KEY) === "1", []);

  useEffect(() => {
    if (dismissed || !isMobileDevice() || isStandalone()) return;

    const handlePrompt = (event: Event) => {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
      setOpen(true);
      setIosHelp(false);
    };

    const handleInstalled = () => {
      setOpen(false);
      setDeferredPrompt(null);
      localStorage.setItem(DISMISS_KEY, "1");
    };

    window.addEventListener("beforeinstallprompt", handlePrompt as EventListener);
    window.addEventListener("appinstalled", handleInstalled);

    if (isIosSafari()) {
      setOpen(true);
      setIosHelp(true);
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handlePrompt as EventListener);
      window.removeEventListener("appinstalled", handleInstalled);
    };
  }, [dismissed]);

  if (!open) return null;

  const dismiss = () => {
    setOpen(false);
    localStorage.setItem(DISMISS_KEY, "1");
  };

  const install = async () => {
    if (iosHelp || !deferredPrompt) return;
    await deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;
    if (choice.outcome === "accepted") {
      localStorage.setItem(DISMISS_KEY, "1");
      setOpen(false);
    }
  };

  return (
    <div className="fixed inset-x-0 bottom-20 z-50 px-4 max-w-lg mx-auto">
      <div className="rounded-2xl border border-border bg-card/95 backdrop-blur-md p-4 shadow-xl">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex items-center gap-2">
            <Download className="h-5 w-5 text-primary" />
            <p className="font-semibold">Install Smart Spend app</p>
          </div>
          <button onClick={dismiss} className="text-muted-foreground hover:text-foreground" aria-label="Close install prompt">
            <X className="h-4 w-4" />
          </button>
        </div>

        {iosHelp ? (
          <p className="text-sm text-muted-foreground mb-3">
            To install on iPhone: tap Share in Safari, then choose Add to Home Screen.
          </p>
        ) : (
          <p className="text-sm text-muted-foreground mb-3">
            Get the app on your phone for a faster, full-screen experience.
          </p>
        )}

        <div className="flex gap-2">
          {!iosHelp && (
            <Button onClick={install} className="flex-1 bg-gradient-primary text-primary-foreground rounded-xl">
              Download app
            </Button>
          )}
          <Button onClick={dismiss} variant="secondary" className="rounded-xl">
            Maybe later
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PwaInstallPrompt;
