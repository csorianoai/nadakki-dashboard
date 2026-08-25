"use client";

import { useEffect } from "react";
import { ServiceWorkerRegister } from "./ServiceWorkerRegister";
import { PWAInstallPrompt } from "./PWAInstallPrompt";
import { purgePwaCaches } from "./cache-cleanup";

const AUTH_STORAGE_KEY = "nadakki_auth";

function installLogoutCachePurge() {
  let wasAuthenticated = window.localStorage.getItem(AUTH_STORAGE_KEY) === "true";

  const checkSession = async () => {
    const isAuthenticated = window.localStorage.getItem(AUTH_STORAGE_KEY) === "true";
    if (wasAuthenticated && !isAuthenticated) await purgePwaCaches();
    wasAuthenticated = isAuthenticated;
  };

  const onStorage = (event: StorageEvent) => {
    if (event.key === AUTH_STORAGE_KEY) void checkSession();
  };
  window.addEventListener("storage", onStorage);
  const interval = window.setInterval(() => void checkSession(), 1000);

  return () => {
    window.removeEventListener("storage", onStorage);
    window.clearInterval(interval);
  };
}

export function PWAClientProvider() {
  useEffect(() => installLogoutCachePurge(), []);

  return (
    <>
      <ServiceWorkerRegister />
      <PWAInstallPrompt />
    </>
  );
}
