"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { GeistSans } from "geist/font/sans";
import { CHTenantGuard } from "@/components/credit-hub/system/CHTenantGuard";
import { CreditHubI18nBootstrap } from "@/components/credit-hub/system/CreditHubI18nBootstrap";
import { DeadlineNotificationBanner } from "@/components/legal/DeadlineNotificationBanner";
import { DemoBannerStrong } from "@/components/legal/DemoBannerStrong";
import { LegalCoreShell } from "@/components/legal/LegalCoreShell";
import { LegalDisclaimerFooter } from "@/components/legal/LegalDisclaimerFooter";
import { LegalSubNav } from "@/components/legal/LegalSubNav";
import { DisasterModeProvider } from "@/app/providers/DisasterModeProvider";

import { ForgeToaster } from "@/components/forge/ui/Toast";
import { ModuleGate } from "@/lib/feature-gating/ModuleGate";
import { useTenant as useCreditHubTenant } from "@/lib/credit-hub/hooks/useTenant";
import "../credit-hub/forge-globals.css";
import "@/styles/legal-contrast.css";

export function LegalLayoutClient({ children }: { children: ReactNode }) {
  const { tenantSlug } = useCreditHubTenant();
  const tenantAttr = tenantSlug ?? undefined;
  const pathname = usePathname();
  const isResearchFullscreen = pathname?.startsWith("/legal/research");

  if (isResearchFullscreen) {
    return (
      <>
        <CreditHubI18nBootstrap />
        <div
          className={`legal-surface flex min-h-0 flex-1 flex-col ${GeistSans.className}`}
          data-portal="legal"
          data-tenant={tenantAttr}
        >
          <CHTenantGuard>
            <ModuleGate module="legal">
              <DisasterModeProvider>
                <div className="flex min-h-0 min-w-0 flex-1 flex-col">{children}</div>
              </DisasterModeProvider>
            </ModuleGate>
          </CHTenantGuard>
          <ForgeToaster />
        </div>
      </>
    );
  }

  return (
    <>
      <CreditHubI18nBootstrap />
      <div
        className={`legal-surface flex min-h-0 flex-1 flex-col ${GeistSans.className}`}
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
          <ModuleGate module="legal">
            <DisasterModeProvider>
              <div className="flex min-h-0 flex-1">
                <div className="flex min-h-0 min-w-0 flex-1 flex-col bg-zinc-950 text-zinc-100">
                  <div className="mx-auto flex min-h-0 w-full max-w-[1400px] flex-1 flex-col px-4 py-5 md:px-6 md:py-6">
                    <DemoBannerStrong />
                    <DeadlineNotificationBanner />
                    <LegalSubNav />
                    <LegalCoreShell>
                      <div className="min-h-0 flex-1">{children}</div>
                    </LegalCoreShell>
                    <div className="mt-10 shrink-0">
                      <LegalDisclaimerFooter />
                    </div>
                  </div>
                </div>
              </div>
            </DisasterModeProvider>
          </ModuleGate>
        </CHTenantGuard>
        <ForgeToaster />
      </div>
    </>
  );
}
