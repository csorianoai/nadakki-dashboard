"use client";

import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useTenantBranding } from "@/lib/hooks/useTenantBranding";
import { resolveVisiblePlatformTitle } from "@/lib/white-label/brand-display";

/** Syncs `document.title` with tenant branding after auth (root metadata stays neutral). */
export function TenantBrandedDocumentTitle({ suffix }: { suffix?: string }) {
  const { tenant, isAuthenticated } = useAuth();
  const { data: branding } = useTenantBranding();

  useEffect(() => {
    if (!isAuthenticated) return;
    const base = resolveVisiblePlatformTitle(branding, tenant);
    document.title = suffix ? `${suffix} | ${base}` : base;
  }, [isAuthenticated, branding, tenant, suffix]);

  return null;
}
