"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import type { ChAppShellProps } from "@/lib/credit-hub/ch-types";

export function ChAppShell({
  persona,
  tenantName,
  children,
  topbar,
  sidebar,
  bottomNav,
  className,
}: ChAppShellProps) {
  return (
    <div
      className={cn("credit-hub-forge ch-shell-layout", className)}
      data-persona={persona}
      data-tenant={tenantName ?? undefined}
    >
      <a href="#ch-main-content" className="ch-skip-link">
        Saltar al contenido principal
      </a>
      {sidebar}
      <div className="ch-shell-main">
        {topbar}
        <main id="ch-main-content" className="ch-shell-content" tabIndex={-1}>
          {children}
        </main>
      </div>
      {bottomNav}
    </div>
  );
}

export type ChAppShellSlotProps = { children: ReactNode };
