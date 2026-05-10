"use client";

import { Search } from "lucide-react";
import { usePersona } from "@/components/credit-hub/system/PersonaProvider";
import { IconButton } from "@/components/forge/ui/IconButton";
import { Skeleton } from "@/components/forge/ui/Skeleton";
import { useTenant as useDashboardTenant } from "@/contexts/TenantContext";
import { useTenantConfig } from "@/lib/credit-hub/hooks/useTenantConfig";
import { personaLabel } from "@/lib/credit-hub/design/persona";
import { useForgeCommandPalette } from "./ForgeCommandPaletteContext";
import { Topbar } from "./Topbar";

export interface ForgeCreditHubTopbarProps {
  /** Tenant logo URL provided by the live branding fetch. Null while loading or when absent. */
  logoUrl?: string | null;
  /** Tenant display name from live branding. Null while loading. */
  tenantName?: string | null;
  /** When true, the logo slot renders as a shimmer skeleton (branding fetch in flight). */
  showLogoSkeleton?: boolean;
}

/**
 * Forge Credit Hub topbar. Renders the persona eyebrow + tenant title +
 * Cmd+K search action. Tenant slots (logo + name) are driven by props
 * passed from `ForgeCreditHubAppShell` based on the live branding fetch.
 *
 * Falls back to `useTenantConfig()` for the title only when no live
 * `tenantName` was forwarded (e.g. legacy callers that mount the topbar
 * outside the shell). The fallback ensures the UI never shows "Credit Hub"
 * when a tenant config is already cached.
 */
export function ForgeCreditHubTopbar({
  logoUrl,
  tenantName,
  showLogoSkeleton = false,
}: ForgeCreditHubTopbarProps = {}) {
  const persona = usePersona();
  const { settings } = useDashboardTenant();
  const { tenantConfig } = useTenantConfig();
  const { toggle } = useForgeCommandPalette();

  const fromBranding = tenantName?.trim();
  const fromBanking = tenantConfig.institution_name?.trim();
  const fromSettings = settings.name?.trim() && settings.name !== "—" ? settings.name.trim() : "";
  const title = fromBranding || fromBanking || fromSettings || "Credit Hub";

  const leading = (
    <div className="flex items-center gap-3">
      {showLogoSkeleton ? (
        <Skeleton
          className="h-8 w-8 motion-reduce:animate-none"
          label="Cargando branding institucional"
        />
      ) : logoUrl ? (
        <span className="inline-flex h-8 w-8 items-center justify-center overflow-hidden rounded-forge-sm bg-forgeBrand-900">
          {/* eslint-disable-next-line @next/next/no-img-element -- tenant-provided same-origin SVG */}
          <img
            src={logoUrl}
            alt=""
            className="h-full w-full object-contain"
            aria-hidden
          />
        </span>
      ) : null}
      <p className="text-forge-xs font-medium uppercase tracking-wide text-forgeInk-500">
        {personaLabel(persona)} portal
      </p>
    </div>
  );

  const actions = (
    <IconButton type="button" variant="subtle" aria-label="Open command palette" onClick={toggle}>
      <Search aria-hidden />
    </IconButton>
  );

  return <Topbar title={title} leading={leading} actions={actions} />;
}
