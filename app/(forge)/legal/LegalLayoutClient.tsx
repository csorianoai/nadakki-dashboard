"use client";

import type { ReactNode } from "react";
import { CHTenantGuard } from "@/components/credit-hub/system/CHTenantGuard";
import { CreditHubI18nBootstrap } from "@/components/credit-hub/system/CreditHubI18nBootstrap";
import { DemoBannerStrong } from "@/components/legal/DemoBannerStrong";
import { LegalDisclaimerFooter } from "@/components/legal/LegalDisclaimerFooter";
import { LegalSubNav } from "@/components/legal/LegalSubNav";
import { DisasterModeProvider } from "@/app/providers/DisasterModeProvider";
import { ForgeAppShell } from "@/components/forge/layout/ForgeAppShell";
import { ForgeAppSidebar } from "@/components/forge/layout/ForgeAppSidebar";
import { ForgeAppTopbar } from "@/components/forge/layout/ForgeAppTopbar";
import { ForgeToaster } from "@/components/forge/ui/Toast";
import { ModuleGate } from "@/lib/feature-gating/ModuleGate";
import { useTenant as useCreditHubTenant } from "@/lib/credit-hub/hooks/useTenant";
import "../credit-hub/forge-globals.css";

export function LegalLayoutClient({ children }: { children: ReactNode }) {
  const { tenantSlug } = useCreditHubTenant();
  const tenantAttr = tenantSlug ?? undefined;

  return (
    <>
      <CreditHubI18nBootstrap />
      <div
        className="flex min-h-screen flex-col bg-forgeSurface-page text-forgeInk-800"
        data-portal="legal"
        data-tenant={tenantAttr}
      >
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-forge-sm focus:bg-forgeBrand-600 focus:px-4 focus:py-2 focus:text-forgeInk-50 focus:shadow-forge-md"
        >
          Saltar al contenido principal
        </a>
        <CHTenantGuard>
          <ForgeAppShell sidebar={<ForgeAppSidebar />} topbar={<ForgeAppTopbar module="legal" />}>
            <ModuleGate module="legal">
              <DisasterModeProvider>
                <div className="flex min-h-0 flex-1 flex-col px-4 py-6 md:px-8 md:py-8">
                <DemoBannerStrong />
                <LegalSubNav />
                <div className="mt-2 min-h-0 flex-1">{children}</div>
                <div className="mt-8 shrink-0">
                  <LegalDisclaimerFooter />
                </div>
                </div>
              </DisasterModeProvider>
            </ModuleGate>
          </ForgeAppShell>
        </CHTenantGuard>
        <ForgeToaster />
      </div>
    </>
  );
}
