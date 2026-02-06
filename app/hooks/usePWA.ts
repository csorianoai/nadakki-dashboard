"use client";

import { useState, useEffect } from "react";

export function usePWA() {
  const [isInstalled, setIsInstalled] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [canInstall, setCanInstall] = useState(false);
  const [isUpdateAvailable, setIsUpdateAvailable] = useState(false);

  useEffect(() => {
    // Detectar si está instalado como PWA
    const isPWAInstalled = window.matchMedia("(display-mode: standalone)").matches;
    setIsInstalled(isPWAInstalled);

    // Detectar conexión
    setIsOnline(navigator.onLine);
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Detectar si se puede instalar
    const beforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setCanInstall(true);
    };
    
    window.addEventListener("beforeinstallprompt", beforeInstallPrompt);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("beforeinstallprompt", beforeInstallPrompt);
    };
  }, []);

  const install = () => {
    console.log("PWA install triggered");
  };

  const update = () => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.ready.then((registration) => {
        registration.update();
      });
    }
  };

  return {
    isInstalled,
    isOnline,
    canInstall,
    isUpdateAvailable,
    install,
    update,
  };
}
