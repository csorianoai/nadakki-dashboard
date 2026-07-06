"use client";

import type { CSSProperties, ReactNode } from "react";
import { CHTenantGuard } from "@/components/credit-hub/system/CHTenantGuard";
import { ModuleGate } from "@/lib/feature-gating/ModuleGate";
import { ForgeToaster } from "@/components/forge/ui/Toast";
import { useTenantBranding } from "@/lib/hooks/useTenantBranding";
import { useTenant } from "@/lib/credit-hub/hooks/useTenant";
import { resolveNautaAccentVars, resolveNautaTenantSlug } from "@/lib/nauta/branding";
import { NAUTA_MIN_WIDTH_PX } from "@/lib/nauta/config";
import { nautaFontClassName } from "@/lib/nauta/nauta-fonts";
import "@/lib/nauta/tokens.css";
import "@/lib/nauta/nauta-v2.css";

export function NautaLayoutClient({ children }: { children: ReactNode }) {
  const { data: branding } = useTenantBranding();
  const { tenantSlug } = useTenant();
  const accentVars = resolveNautaAccentVars(branding);
  const dataTenant = resolveNautaTenantSlug(branding, tenantSlug);

  return (
    <div
      className={`nauta-v2 flex min-h-0 flex-1 flex-col ${nautaFontClassName}`}
      data-portal="nauta"
      data-tenant={dataTenant}
      style={
        {
          ...accentVars,
          minWidth: NAUTA_MIN_WIDTH_PX,
        } as CSSProperties
      }
    >
      <CHTenantGuard>
        <ModuleGate module="nauta">
          <div className="flex min-h-0 w-full flex-1 flex-col overflow-x-auto">{children}</div>
        </ModuleGate>
      </CHTenantGuard>
      <ForgeToaster />
    </div>
  );
}
