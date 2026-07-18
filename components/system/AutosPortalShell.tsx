"use client";

import { useEffect, type ReactNode } from "react";
import { cleanupLegacyAutosDocumentAttrs } from "@/components/system/autos-portal-scope";

/** Autos marketplace surface — tokens scoped to this container, not documentElement. */
export function AutosPortalShell({ children }: { children: ReactNode }) {
  useEffect(() => {
    cleanupLegacyAutosDocumentAttrs();
    return () => {
      cleanupLegacyAutosDocumentAttrs();
    };
  }, []);

  return (
    <div
      data-portal="autos"
      data-theme="light"
      data-tenant="nadakki"
      className="min-h-screen overflow-x-hidden bg-nk-bg text-nk-fg font-inter antialiased"
    >
      {children}
    </div>
  );
}
