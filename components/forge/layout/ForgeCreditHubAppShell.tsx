"use client";

import { type CSSProperties, type ReactNode, useMemo, useRef } from "react";
import { useSelectedLayoutSegments } from "next/navigation";
import { PersonaProvider } from "@/components/credit-hub/system/PersonaProvider";
import { CHFeatureFlagBanner } from "@/components/credit-hub/system/CHFeatureFlagBanner";
import { CHTenantGuard } from "@/components/credit-hub/system/CHTenantGuard";
import { ForgeToaster } from "@/components/forge/ui/Toast";
import { TenantBrandingErrorBanner } from "@/components/forge/ui/TenantBrandingErrorBanner";
import { useTenant as useCreditHubTenant } from "@/lib/credit-hub/hooks/useTenant";
import { useTenantBranding } from "@/lib/credit-hub/hooks/useTenantBranding";
import { creditHubPersonaFromLayoutSegments } from "./creditHubPersonaFromSegments";
import { ForgeCommandPaletteProvider } from "./ForgeCommandPaletteContext";
import { ForgeCreditHubSidebar } from "./ForgeCreditHubSidebar";

/**
 * Credit Hub inner chrome under {@link GlobalForgeAppShell}: persona, branding,
 * tenant guard, command palette, secondary sidebar + page content.
 * Primary cores navigation and unified top bar live in `GlobalForgeAppShell`.
 */
export function ForgeCreditHubAppShell({ children }: { children: ReactNode }) {
  const segments = useSelectedLayoutSegments();
  const persona = useMemo(() => creditHubPersonaFromLayoutSegments(segments), [segments]);
  const { tenantSlug } = useCreditHubTenant();
  const { data: branding, isPending, isError, error, refetch } = useTenantBranding(tenantSlug);

  const errorReferenceIdRef = useRef<string>(
    `ERR-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
  );

  const tenantAttr = branding?.tenant_id ?? tenantSlug ?? undefined;

  const brandingStyle: CSSProperties | undefined = branding
    ? ({
        ["--forge-brand-500" as string]: branding.brand_primary,
        ["--forge-brand-900" as string]: branding.brand_dark,
      } as CSSProperties)
    : undefined;

  return (
    <PersonaProvider persona={persona}>
      <div
        className="flex min-h-0 flex-1 flex-col bg-forgeSurface-page text-forgeGray-800"
        data-portal={persona}
        data-tenant={tenantAttr}
        style={brandingStyle}
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
              <ForgeCreditHubSidebar showHeaderSkeleton={isPending} />
              <div className="flex min-h-0 min-w-0 flex-1 flex-col">
                {isError ? (
                  <TenantBrandingErrorBanner
                    referenceId={errorReferenceIdRef.current}
                    error={error}
                    onRetry={() => {
                      void refetch();
                    }}
                  />
                ) : null}
                {children}
              </div>
            </div>
          </ForgeCommandPaletteProvider>
        </CHTenantGuard>
        <ForgeToaster />
      </div>
    </PersonaProvider>
  );
}
