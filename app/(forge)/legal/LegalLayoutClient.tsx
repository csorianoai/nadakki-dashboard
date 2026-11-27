"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { GeistSans } from "geist/font/sans";
import { CHTenantGuard } from "@/components/credit-hub/system/CHTenantGuard";
import { CreditHubI18nBootstrap } from "@/components/credit-hub/system/CreditHubI18nBootstrap";
import { DeadlineNotificationBanner } from "@/components/legal/DeadlineNotificationBanner";
import { DemoBannerStrong } from "@/components/legal/DemoBannerStrong";
import { LegalCoreShell } from "@/components/legal/LegalCoreShell";
import { LegalAvisoInicial } from "@/components/legal/LegalAvisoInicial";
import { AsistenteAyuda } from "@/components/legal/ayuda/AsistenteAyuda";
import { DisasterModeProvider } from "@/app/providers/DisasterModeProvider";

import { ForgeToaster } from "@/components/forge/ui/Toast";
import { ModuleGate } from "@/lib/feature-gating/ModuleGate";
import { useTenant as useCreditHubTenant } from "@/lib/credit-hub/hooks/useTenant";
import "../credit-hub/forge-globals.css";
import "@/styles/legal-contrast.css";
import "@/styles/legal-claro.css";

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
          className={`legal-surface legal-claro flex min-h-0 flex-1 flex-col ${GeistSans.className}`}
          data-portal="legal"
          data-tenant={tenantAttr}
        >
          <CHTenantGuard>
            <ModuleGate module="legal">
              <DisasterModeProvider>
                <LegalAvisoInicial />
                <div className="flex min-h-0 min-w-0 flex-1 flex-col">{children}</div>
                <AsistenteAyuda />
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
        className={`legal-surface legal-claro flex min-h-0 flex-1 flex-col ${GeistSans.className}`}
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
                <div className="flex min-h-0 min-w-0 flex-1 flex-col bg-white text-slate-900">
                  <div className="mx-auto flex min-h-0 w-full max-w-[1400px] flex-1 flex-col px-4 py-5 md:px-6 md:py-6">
                    <LegalAvisoInicial />
                    <DemoBannerStrong />
                    {/* En Mi despacho los plazos ya encabezan la pantalla («Atención prioritaria»): no se repiten arriba. */}
                    {pathname === "/legal" || pathname?.endsWith("/deadlines") ? null : <DeadlineNotificationBanner />}
                    {/* Las pestañas de Legal las pinta ModuleShell (PestanasGrupo) desde el registro; ya no hay barra propia. */}
                    <LegalCoreShell>
                      {/* pb-20: el botón flotante del asistente (56 px, abajo a la derecha) no tapa el final de la página. */}
                      <div className="min-h-0 flex-1 pb-20">{children}</div>
                    </LegalCoreShell>
                  </div>
                </div>
              </div>
              <AsistenteAyuda />
            </DisasterModeProvider>
          </ModuleGate>
        </CHTenantGuard>
        <ForgeToaster />
      </div>
    </>
  );
}
