"use client";

import { type ReactNode } from "react";
import { BankSideNav } from "@/components/credit-hub/bank/navigation/BankSideNav";
import { BankTopBar } from "@/components/credit-hub/bank/navigation/BankTopBar";
import { ForgeToaster } from "@/components/credit-hub/system/ForgeToaster";
import { CHFeatureFlagBanner } from "@/components/credit-hub/system/CHFeatureFlagBanner";
import { CHTenantGuard } from "@/components/credit-hub/system/CHTenantGuard";
import { PortalShell } from "@/components/credit-hub/system/PortalShell";

export default function BankLayout({ children }: { children: ReactNode }) {
  return (
    <PortalShell persona="bank">
      <CHFeatureFlagBanner />
      <BankTopBar />
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-forge-primary focus:px-4 focus:py-2 focus:text-white"
      >
        Saltar al contenido principal
      </a>
      <CHTenantGuard>
        <div className="flex min-h-[calc(100vh-4rem)]">
          <BankSideNav />
          <main id="main-content" className="mx-auto w-full max-w-7xl p-4 md:p-8">
            {children}
          </main>
        </div>
      </CHTenantGuard>
      <ForgeToaster />
    </PortalShell>
  );
}
