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
import { ForgeAppShell } from "./ForgeAppShell";
import { ForgeCreditHubSidebar } from "./ForgeCreditHubSidebar";
import { ForgeCreditHubTopbar } from "./ForgeCreditHubTopbar";

/**
 * Top-level shell for the Forge Credit Hub. Wires the live tenant-branding
 * fetch into the chrome:
 *
 * - On success: applies `data-tenant` and the per-tenant CSS variables
 *   (`--forge-brand-500`, `--forge-brand-900`) inline so `tokens.css`
 *   ramps cascade through the entire `.forge-app` subtree.
 * - On loading: forwards `showHeaderSkeleton` / `showLogoSkeleton` props
 *   to sidebar and topbar so only the tenant-specific slots shimmer.
 * - On error: renders the persistent `TenantBrandingErrorBanner` between
 *   topbar and main content; chrome continues with default tokens.
 */
export function ForgeCreditHubAppShell({ children }: { children: ReactNode }) {
  const segments = useSelectedLayoutSegments();
  const persona = useMemo(() => creditHubPersonaFromLayoutSegments(segments), [segments]);
  const { tenantId, tenantSlug } = useCreditHubTenant();
  // P10-05 BUG-001 fix: pass tenantSlug (resolved by useTenant), not tenantId
  // (UUID). Backend `/api/v2/tenants/{slug}/branding` keys by slug.
  const { data: branding, isPending, isError, error, refetch } =
    useTenantBranding(tenantSlug);

  // Stable per-mount reference id for the error banner. We do not regenerate
  // it on each render to avoid the user seeing the id change while reading.
  const errorReferenceIdRef = useRef<string>(
    `ERR-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
  );

  // Only commit data-tenant when fetch succeeded; never with a default value.
  const tenantAttr = branding?.tenant_id ?? tenantSlug ?? undefined;

  // CSS variables flow through tokens.css; only set when fetch succeeded.
  const brandingStyle: CSSProperties | undefined = branding
    ? ({
        ["--forge-brand-500" as string]: branding.brand_primary,
        ["--forge-brand-900" as string]: branding.brand_dark,
      } as CSSProperties)
    : undefined;

  return (
    <PersonaProvider persona={persona}>
      <div
        className="flex min-h-screen flex-col bg-forgeSurface-page text-forgeInk-800"
        data-portal={persona}
        data-tenant={tenantAttr}
        style={brandingStyle}
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
              sidebar={
                <ForgeCreditHubSidebar showHeaderSkeleton={isPending} />
              }
              topbar={
                <ForgeCreditHubTopbar
                  logoUrl={isPending ? null : branding?.logo_url ?? null}
                  tenantName={isPending ? null : branding?.display_name ?? null}
                  showLogoSkeleton={isPending}
                />
              }
            >
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
            </ForgeAppShell>
          </ForgeCommandPaletteProvider>
        </CHTenantGuard>
        <ForgeToaster />
      </div>
    </PersonaProvider>
  );
}
