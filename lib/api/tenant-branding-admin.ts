"use client";

import { tokenStorage } from "@/lib/auth/token-storage";
import type { TenantBranding } from "@/lib/credit-hub/types/tenantBranding";

export type TenantBrandingPatch = Partial<
  Pick<
    TenantBranding,
    | "display_name"
    | "brand_primary"
    | "brand_dark"
    | "locale"
    | "currency"
    | "regulatory_profile"
    | "application_status_labels"
    | "copy_overrides"
    | "logo_url"
  >
> & {
  accent_color?: string;
  secondary_color?: string;
  custom_css?: string;
  font_family?: string | null;
  dark_mode_enabled?: boolean;
};

function baseUrl(): string {
  return "";
}

function bearer(): string {
  const t = tokenStorage.getAccessToken();
  if (!t) throw new Error("Not authenticated");
  return t;
}

export async function fetchTenantBrandingAdmin(tenantId: string): Promise<TenantBranding> {
  const res = await fetch(`${baseUrl()}/api/v2/tenants/${encodeURIComponent(tenantId)}/branding`, {
    headers: {
      Authorization: `Bearer ${bearer()}`,
      Accept: "application/json",
    },
  });
  if (!res.ok) throw new Error(`GET branding ${res.status}`);
  return res.json();
}

export async function putTenantBranding(tenantId: string, body: TenantBrandingPatch): Promise<TenantBranding> {
  const res = await fetch(`${baseUrl()}/api/v2/tenants/${encodeURIComponent(tenantId)}/branding`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${bearer()}`,
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(t || `PUT branding ${res.status}`);
  }
  return res.json();
}

export async function postTenantBrandingLogo(tenantId: string, file: File): Promise<{ logo_url: string | null }> {
  const fd = new FormData();
  fd.append("logo", file);

  const res = await fetch(`${baseUrl()}/api/v2/tenants/${encodeURIComponent(tenantId)}/branding/logo`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${bearer()}`,
    },
    body: fd,
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(t || `POST logo ${res.status}`);
  }
  return res.json();
}

export async function deleteTenantBrandingLogo(tenantId: string): Promise<void> {
  const res = await fetch(`${baseUrl()}/api/v2/tenants/${encodeURIComponent(tenantId)}/branding/logo`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${bearer()}`,
    },
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(t || `DELETE logo ${res.status}`);
  }
}
