"use client";
import { useState, useEffect, useCallback } from "react";

interface PWAState {
  isInstalled: boolean;
  isOnline: boolean;
  canInstall: boolean;
  isUpdateAvailable: boolean;
  displayMode: "standalone" | "browser";
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
    displayMode: "browser",
  });

  // Check if already installed
  useEffect(() => {
    if (typeof window === "undefined") return;

    const checkInstalled = () => {
      const isStandalone = window.matchMedia(
        "(display-mode: standalone)",
      ).matches;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const isIOSStandalone = (navigator as any).standalone === true;
      const installed = isStandalone || isIOSStandalone;
      setState((s) => ({
        ...s,
        isInstalled: installed,
        displayMode: installed ? "standalone" : "browser",
      }));
    };

    checkInstalled();
    const mq = window.matchMedia("(display-mode: standalone)");
    mq.addEventListener("change", checkInstalled);
    return () => mq.removeEventListener("change", checkInstalled);
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

  // Listen for SW update
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator))
      return;

    const handleControllerChange = () => {
      setState((s) => ({ ...s, isUpdateAvailable: true }));
    };

    navigator.serviceWorker.addEventListener(
      "controllerchange",
      handleControllerChange,
    );
    return () =>
      navigator.serviceWorker.removeEventListener(
        "controllerchange",
        handleControllerChange,
      );
  }, []);

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

  const update = useCallback(() => {
    window.location.reload();
  }, []);

  return {
    ...state,
    install,
    update,
  };
}

export default usePWA;
