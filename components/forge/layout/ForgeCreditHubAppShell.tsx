"use client";

import { type ReactNode, useMemo } from "react";
import { useSelectedLayoutSegments } from "next/navigation";
import { PersonaProvider } from "@/components/credit-hub/system/PersonaProvider";
import { CHFeatureFlagBanner } from "@/components/credit-hub/system/CHFeatureFlagBanner";
import { CHTenantGuard } from "@/components/credit-hub/system/CHTenantGuard";
import { ForgeToaster } from "@/components/forge/ui/Toast";
import { useTenant as useCreditHubTenant } from "@/lib/credit-hub/hooks/useTenant";
import { creditHubPersonaFromLayoutSegments } from "./creditHubPersonaFromSegments";
import { ForgeCommandPaletteProvider } from "./ForgeCommandPaletteContext";
import { ForgeAppShell } from "./ForgeAppShell";
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
          <ForgeCommandPaletteProvider>
            <ForgeAppShell
              beforeContent={
                <span
                  className="pointer-events-none fixed left-0 top-0 -z-10 h-4 w-4 bg-forgeBrand-500 opacity-0"
                  data-token-debug="brand-500"
                  aria-hidden
                />
              }
              sidebar={<ForgeCreditHubSidebar />}
              topbar={<ForgeCreditHubTopbar />}
            >
              {children}
            </ForgeAppShell>
          </ForgeCommandPaletteProvider>
        </CHTenantGuard>
        <ForgeToaster />
      </div>
    </PersonaProvider>
  );
}
