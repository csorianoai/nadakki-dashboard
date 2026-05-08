"use client";

import type { ReactNode } from "react";
import { GeistSans } from "geist/font/sans";
import { CHTenantGuard } from "@/components/credit-hub/system/CHTenantGuard";
import { CreditHubI18nBootstrap } from "@/components/credit-hub/system/CreditHubI18nBootstrap";
import { DemoBannerStrong } from "@/components/legal/DemoBannerStrong";
import { LegalCoreShell } from "@/components/legal/LegalCoreShell";
import { LegalDisclaimerFooter } from "@/components/legal/LegalDisclaimerFooter";
import { LegalSubNav } from "@/components/legal/LegalSubNav";
import { DisasterModeProvider } from "@/app/providers/DisasterModeProvider";
import { ForgeAppShell } from "@/components/forge/layout/ForgeAppShell";
import { ForgeCollapsibleNavRail } from "@/components/forge/layout/ForgeCollapsibleNavRail";
import { ForgeLayoutChromeProvider } from "@/components/forge/layout/ForgeLayoutChromeContext";
import { UnifiedTopBar } from "@/components/forge/layout/UnifiedTopBar";
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
      <ForgeLayoutChromeProvider>
        <div
          className={`flex min-h-screen flex-col bg-zinc-950 text-zinc-100 ${GeistSans.className}`}
          data-portal="legal"
          data-tenant={tenantAttr}
        >
          <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-violet-600 focus:px-4 focus:py-2 focus:text-zinc-50 focus:shadow-lg"
          >
            Saltar al contenido principal
          </a>
          <CHTenantGuard>
            <ForgeAppShell sidebar={<ForgeCollapsibleNavRail />} topbar={<UnifiedTopBar />}>
              <ModuleGate module="legal">
                <DisasterModeProvider>
                  <div className="flex min-h-0 w-full flex-1 flex-col px-4 py-5 sm:px-6 lg:px-8 xl:px-10 md:py-6">
                    <DemoBannerStrong />
                    <LegalSubNav />
                    <LegalCoreShell>
                      <div className="min-h-0 flex-1">{children}</div>
                    </LegalCoreShell>
                    <div className="mt-10 shrink-0">
                      <LegalDisclaimerFooter />
                    </div>
                  </div>
                </DisasterModeProvider>
              </ModuleGate>
            </ForgeAppShell>
          </CHTenantGuard>
          <ForgeToaster />
        </div>
      </ForgeLayoutChromeProvider>
    </>
  );
}
