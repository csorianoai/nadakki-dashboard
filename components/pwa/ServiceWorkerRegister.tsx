"use client";

import { useEffect } from "react";

export function ServiceWorkerRegister() {
  useEffect(() => {
    if (
      typeof window === "undefined" ||
      !("serviceWorker" in navigator) ||
      process.env.NODE_ENV === "development"
    ) {
      return;
    }

    const register = async () => {
      try {
        const registration = await navigator.serviceWorker.register("/sw.js", {
          scope: "/",
        });
        console.log("[PWA] SW registered, scope:", registration.scope);
      } catch (err) {
        console.error("[PWA] SW registration failed:", err);
      }
    };

    register();
  }, []);

  return null;
}
