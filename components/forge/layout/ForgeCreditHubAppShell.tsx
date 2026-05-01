"use client";

import { type ReactNode, useMemo } from "react";
import { useSelectedLayoutSegments } from "next/navigation";
import { PersonaProvider } from "@/components/credit-hub/system/PersonaProvider";
import { CHFeatureFlagBanner } from "@/components/credit-hub/system/CHFeatureFlagBanner";
import { CHTenantGuard } from "@/components/credit-hub/system/CHTenantGuard";
import { ForgeToaster } from "@/components/forge";
import { useTenant as useCreditHubTenant } from "@/lib/credit-hub/hooks/useTenant";
import { creditHubPersonaFromLayoutSegments } from "./creditHubPersonaFromSegments";
import { ForgeCreditHubSidebar } from "./ForgeCreditHubSidebar";
import { ForgeCreditHubTopbar } from "./ForgeCreditHubTopbar";

export function ForgeCreditHubAppShell({ children }: { children: ReactNode }) {
  const segments = useSelectedLayoutSegments();
  const persona = useMemo(() => creditHubPersonaFromLayoutSegments(segments), [segments]);
  const { tenantSlug } = useCreditHubTenant();
  const tenantAttr = tenantSlug ?? undefined;

  return (
    <PersonaProvider persona={persona}>
      <div
        className="flex min-h-screen flex-col bg-forgeSurface-page text-forgeInk-800"
        data-portal={persona}
        data-tenant={tenantAttr}
      >
        <CHFeatureFlagBanner />
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-forge-sm focus:bg-forgeBrand-600 focus:px-4 focus:py-2 focus:text-forgeInk-50 focus:shadow-forge-md"
        >
          Saltar al contenido principal
        </a>
        <CHTenantGuard>
          <div className="flex min-h-[calc(100vh-4rem)] flex-1">
            <ForgeCreditHubSidebar />
            <div className="flex min-w-0 flex-1 flex-col">
              <ForgeCreditHubTopbar />
              <main id="main-content" className="min-h-0 flex-1">
                {children}
              </main>
            </div>
          </div>
        </CHTenantGuard>
        <ForgeToaster />
      </div>
    </PersonaProvider>
  );
}
