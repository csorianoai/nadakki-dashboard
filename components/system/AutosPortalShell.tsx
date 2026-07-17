"use client";

import { useEffect, type ReactNode } from "react";

/** Marks the document as autos marketplace surface (scoped CSS + analytics). */
export function AutosPortalShell({ children }: { children: ReactNode }) {
  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute("data-portal", "autos");
    return () => {
      root.removeAttribute("data-portal");
    };
  }, []);

  return (
    <div data-portal="autos" className="min-h-screen overflow-x-hidden bg-nk-bg text-nk-fg font-inter antialiased">
      {children}
    </div>
  );
}
