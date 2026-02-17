"use client";
import { useState, useEffect, useCallback } from "react";

interface PWAState {
  isInstalled: boolean;
  isOnline: boolean;
  canInstall: boolean;
  isUpdateAvailable: boolean;
  registration: ServiceWorkerRegistration | null;
}

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

let deferredPrompt: BeforeInstallPromptEvent | null = null;

export function usePWA() {
  const [state, setState] = useState<PWAState>({
    isInstalled: false,
    isOnline: typeof navigator !== "undefined" ? navigator.onLine : true,
    canInstall: false,
    isUpdateAvailable: false,
    registration: null,
  });

  // Register service worker
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;

    const registerSW = async () => {
      try {
        const registration = await navigator.serviceWorker.register("/sw.js", {
          scope: "/",
        });

        setState((s) => ({ ...s, registration }));

        // Check for updates
        registration.addEventListener("updatefound", () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener("statechange", () => {
              if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
                setState((s) => ({ ...s, isUpdateAvailable: true }));
              }
            });
          }
        });

        console.log("[PWA] Service Worker registered");
      } catch (error) {
        console.error("[PWA] Service Worker registration failed:", error);
      }
    };

    registerSW();
  }, []);

  // Check if already installed
  useEffect(() => {
    if (typeof window === "undefined") return;

    const checkInstalled = () => {
      const isStandalone = window.matchMedia("(display-mode: standalone)").matches;
      const isIOSStandalone = (navigator as any).standalone === true;
      setState((s) => ({ ...s, isInstalled: isStandalone || isIOSStandalone }));
    };

    checkInstalled();
    window.matchMedia("(display-mode: standalone)").addEventListener("change", checkInstalled);
  }, []);

  // Listen for install prompt
  useEffect(() => {
    if (typeof window === "undefined") return;

    const handler = (e: Event) => {
      e.preventDefault();
      deferredPrompt = e as BeforeInstallPromptEvent;
      setState((s) => ({ ...s, canInstall: true }));
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  // Listen for online/offline
  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleOnline = () => setState((s) => ({ ...s, isOnline: true }));
    const handleOffline = () => setState((s) => ({ ...s, isOnline: false }));

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Install app
  const install = useCallback(async () => {
    if (!deferredPrompt) return false;

    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      deferredPrompt = null;
      setState((s) => ({ ...s, canInstall: false }));
      return outcome === "accepted";
    } catch {
      return false;
    }
  }, []);

  // Update app
  const update = useCallback(async () => {
    if (!state.registration?.waiting) return;
    state.registration.waiting.postMessage({ type: "SKIP_WAITING" });
    window.location.reload();
  }, [state.registration]);

  return {
    ...state,
    install,
    update,
  };
}

export default usePWA;