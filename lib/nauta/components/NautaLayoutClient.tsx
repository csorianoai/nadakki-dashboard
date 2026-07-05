"use client";

import type { ReactNode } from "react";
import { GeistSans } from "geist/font/sans";
import { CHTenantGuard } from "@/components/credit-hub/system/CHTenantGuard";
import { ModuleGate } from "@/lib/feature-gating/ModuleGate";
import { ForgeToaster } from "@/components/forge/ui/Toast";
import "@/app/(forge)/credit-hub/forge-globals.css";

export function NautaLayoutClient({ children }: { children: ReactNode }) {
  return (
    <div
      className={`nauta-surface flex min-h-0 flex-1 flex-col bg-zinc-950 text-zinc-100 ${GeistSans.className}`}
      data-portal="nauta"
    >
      <CHTenantGuard>
        <ModuleGate module="nauta">
          <div className="mx-auto flex min-h-0 w-full max-w-[1400px] flex-1 flex-col px-4 py-5 md:px-6 md:py-6">
            {children}
          </div>
        </ModuleGate>
      </CHTenantGuard>
      <ForgeToaster />
    </div>
  );
}
