"use client";

import type { ReactNode } from "react";

export interface ForgeAppShellProps {
  sidebar: ReactNode;
  topbar: ReactNode;
  children: ReactNode;
  /** Injected before the main flex row (e.g. Credit Hub token debug span). */
  beforeContent?: ReactNode;
}

/**
 * Shared two-column shell: sidebar + (topbar + main). No command palette —
 * Credit Hub wraps this with `ForgeCommandPaletteProvider` when needed.
 */
export function ForgeAppShell({ sidebar, topbar, children, beforeContent }: ForgeAppShellProps) {
  return (
    <>
      {beforeContent}
      <div className="flex min-h-0 flex-1">
        {sidebar}
        <div className="flex min-h-0 min-w-0 flex-1 flex-col">
          {topbar}
          <main id="main-content" className="flex min-h-0 flex-1 flex-col overflow-y-auto">
            {children}
          </main>
        </div>
      </div>
    </>
  );
}
