"use client";

import { type ReactNode } from "react";
import { CHFeatureFlagBanner } from "@/components/credit-hub/system/CHFeatureFlagBanner";
import { CHTenantGuard } from "@/components/credit-hub/system/CHTenantGuard";
import { DealerBottomNav } from "@/components/credit-hub/navigation/DealerBottomNav";
import { DealerTopBar } from "@/components/credit-hub/navigation/DealerTopBar";
import { PortalShell } from "@/components/credit-hub/system/PortalShell";

export default function DealerLayout({ children }: { children: ReactNode }) {
  return (
    <PortalShell persona="dealer">
      <CHFeatureFlagBanner />
      <DealerTopBar />
      <CHTenantGuard>
        <main className="mx-auto max-w-7xl pb-20 lg:pb-8">{children}</main>
      </CHTenantGuard>
      <DealerBottomNav />
    </PortalShell>
  );
}
