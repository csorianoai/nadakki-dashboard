"use client";

import { type ReactNode } from "react";
import { CHFeatureFlagBanner } from "@/components/credit-hub/system/CHFeatureFlagBanner";
import { CHTenantGuard } from "@/components/credit-hub/system/CHTenantGuard";
import { DealerBottomNav } from "@/components/credit-hub/navigation/DealerBottomNav";
import { DealerTopBar } from "@/components/credit-hub/navigation/DealerTopBar";
import { PortalShell } from "@/components/credit-hub/system/PortalShell";
import { ForgeToaster } from "@/components/credit-hub/system/ForgeToaster";

export default function DealerLayout({ children }: { children: ReactNode }) {
  return (
    <PortalShell persona="dealer">
      <CHFeatureFlagBanner />
      <DealerTopBar />
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-forge-primary focus:px-4 focus:py-2 focus:text-white"
      >
        Saltar al contenido principal
      </a>
      <CHTenantGuard>
        <main id="main-content" className="mx-auto max-w-7xl pb-20 lg:pb-8">
          {children}
        </main>
      </CHTenantGuard>
      <DealerBottomNav />
      <ForgeToaster />
    </PortalShell>
  );
}
