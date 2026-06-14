"use client";

import { type ReactNode, useMemo } from "react";
import { useSelectedLayoutSegments } from "next/navigation";
import { PersonaProvider } from "@/components/credit-hub/system/PersonaProvider";
import { CHFeatureFlagBanner } from "@/components/credit-hub/system/CHFeatureFlagBanner";
import { CHTenantGuard } from "@/components/credit-hub/system/CHTenantGuard";
import { ForgeToaster } from "@/components/forge/ui/Toast";
import { useTenant as useCreditHubTenant } from "@/lib/credit-hub/hooks/useTenant";
import { useTenantBranding } from "@/lib/hooks/useTenantBranding";
import { creditHubPersonaFromLayoutSegments } from "./creditHubPersonaFromSegments";
import { ForgeCommandPaletteProvider } from "./ForgeCommandPaletteContext";
import { ForgeCreditHubSidebar } from "./ForgeCreditHubSidebar";

/**
 * Credit Hub inner chrome under the global Forge shell: persona, branding
 * attribution on the subtree, tenant guard, command palette, Credit sidebar +
 * pages. CSS variables apply globally via `TenantBrandingProvider`; no error
 * banner on fetch failures (defaults + retry via react-query).
 */
export function ForgeCreditHubAppShell({ children }: { children: ReactNode }) {
  const segments = useSelectedLayoutSegments();
  const persona = useMemo(() => creditHubPersonaFromLayoutSegments(segments), [segments]);
  const { tenantSlug } = useCreditHubTenant();
  const { data: branding, isPending } = useTenantBranding();

  const tenantAttr = branding?.tenant_id ?? tenantSlug ?? undefined;

  return (
    <PersonaProvider persona={persona}>
      <div
        className="flex min-h-0 flex-1 flex-col bg-forgeSurface-page text-forgeGray-800"
        data-portal={persona}
        data-tenant={tenantAttr}
      >
        <CHFeatureFlagBanner />
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-forge-sm focus:bg-forgeBrand-600 focus:px-4 focus:py-2 focus:text-forgeGray-50 focus:shadow-forge-md"
        >
          Saltar al contenido principal
        </a>
        <CHTenantGuard>
          <ForgeCommandPaletteProvider>
            <span
              className="pointer-events-none fixed left-0 top-0 -z-10 h-4 w-4 bg-forgeBrand-500 opacity-0"
              data-token-debug="brand-500"
              aria-hidden
            />
            <div className="flex min-h-0 min-w-0 flex-1">
              <div className="sticky top-0 hidden max-h-[calc(100dvh-3.5rem)] shrink-0 self-start overflow-y-auto lg:block">
                <ForgeCreditHubSidebar showHeaderSkeleton={isPending} />
              </div>
              <div className="flex min-h-0 min-w-0 flex-1 flex-col">{children}</div>
            </div>
          </ForgeCommandPaletteProvider>
        </CHTenantGuard>
        <ForgeToaster />
      </div>
    </PersonaProvider>
  );
}
