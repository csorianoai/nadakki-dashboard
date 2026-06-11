"use client";

import { ServiceWorkerRegister } from "./ServiceWorkerRegister";
import { PWAInstallPrompt } from "./PWAInstallPrompt";

export function PWAClientProvider() {
  return (
    <>
      <ServiceWorkerRegister />
      <PWAInstallPrompt />
    </>
  );
}
