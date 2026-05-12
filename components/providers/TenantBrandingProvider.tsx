"use client";

import { type ReactNode, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import type { TenantBranding } from "@/lib/credit-hub/types/tenantBranding";
import { useTenantBranding } from "@/lib/hooks/useTenantBranding";

export function TenantBrandingProvider({ children }: { children: ReactNode }) {
  const { tenant } = useAuth();
  const { data: branding } = useTenantBranding();

  useEffect(() => {
    const root = document.documentElement;

    const clearForgeInline = () => {
      const props = [
        "--forge-brand-500",
        "--forge-brand-primary",
        "--forge-brand-900",
        "--forge-brand-secondary",
        "--forge-tenant-primary",
        "--forge-tenant-secondary",
        "--forge-tenant-accent",
        "--forge-accent-gold",
        "--forge-brand-600",
        "--forge-tenant-dark",
        "--forge-font-body",
      ];
      props.forEach((p) => root.style.removeProperty(p));
    };

    if (!tenant?.id) {
      document.body.removeAttribute("data-tenant-id");
      clearForgeInline();
      return;
    }

    const bodyKey = branding?.tenant_id ?? tenant.slug ?? tenant.id;
    document.body.setAttribute("data-tenant-id", bodyKey);

    if (branding) {
      applyBrandingVars(root, branding);
    }

    return () => {
      document.body.removeAttribute("data-tenant-id");
      clearForgeInline();
    };
  }, [tenant?.id, tenant?.slug, branding]);

  return <>{children}</>;
}

/** Maps `_API_CONTRACT.md` branding fields (+ optional P11-05 extras) onto `:root`. */
function applyBrandingVars(root: HTMLElement, branding: TenantBranding) {
  if (branding.brand_primary) {
    root.style.setProperty("--forge-brand-500", branding.brand_primary);
    root.style.setProperty("--forge-brand-primary", branding.brand_primary);
    root.style.setProperty("--forge-tenant-primary", branding.brand_primary);
  }
  if (branding.brand_dark) {
    root.style.setProperty("--forge-brand-900", branding.brand_dark);
    root.style.setProperty("--forge-brand-secondary", branding.brand_dark);
    root.style.setProperty("--forge-tenant-dark", branding.brand_dark);
  }
  const ext = branding;
  if (ext.secondary_color) {
    root.style.setProperty("--forge-tenant-secondary", ext.secondary_color);
  }
  if (ext.accent_color) {
    root.style.setProperty("--forge-accent-gold", ext.accent_color);
    root.style.setProperty("--forge-tenant-accent", ext.accent_color);
  }
  if (ext.font_family) {
    root.style.setProperty(
      "--forge-font-body",
      `${ext.font_family}, var(--forge-font-sans), -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`,
    );
  }
}
