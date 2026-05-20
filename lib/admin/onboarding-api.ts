import { apiFetch } from "@/lib/api/fetch-client";
import type { OnboardingActivateResponse, OnboardingDraftResponse } from "@/types/onboarding";

export async function postOnboardingDraft(
  payload: unknown,
): Promise<{ ok: boolean; status: number; data?: OnboardingDraftResponse; error?: string }> {
  const res = await apiFetch("/api/v2/admin/tenants/onboarding/draft", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const t = await res.text().catch(() => "");
    return { ok: false, status: res.status, error: t || res.statusText };
  }
  const data = (await res.json().catch(() => ({}))) as OnboardingDraftResponse;
  return { ok: true, status: res.status, data };
}

export async function postOnboardingActivate(
  payload: unknown,
): Promise<{ ok: boolean; status: number; data?: OnboardingActivateResponse; error?: string }> {
  const res = await apiFetch("/api/v2/admin/tenants/onboarding/activate", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const t = await res.text().catch(() => "");
    return { ok: false, status: res.status, error: t || res.statusText };
  }
  const data = (await res.json().catch(() => ({}))) as OnboardingActivateResponse;
  return { ok: true, status: res.status, data };
}

export async function postUploadTenantLogo(
  tenantId: string,
  file: File,
): Promise<{ ok: boolean; status: number; data?: unknown; error?: string }> {
  const fd = new FormData();
  fd.append("file", file);
  const res = await apiFetch(`/api/v2/admin/tenants/${encodeURIComponent(tenantId)}/branding/upload-logo`, {
    method: "POST",
    body: fd,
  });
  if (!res.ok) {
    const t = await res.text().catch(() => "");
    return { ok: false, status: res.status, error: t || res.statusText };
  }
  const data = await res.json().catch(() => ({}));
  return { ok: true, status: res.status, data };
}

/** Submit hashed / secret credential material for bank cores (credentials router). */
export async function postTenantBankCredentialSecrets(
  tenantId: string,
  payload: unknown,
): Promise<{ ok: boolean; status: number; data?: unknown; error?: string }> {
  const res = await apiFetch(`/api/v2/admin/tenants/${encodeURIComponent(tenantId)}/credentials`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const t = await res.text().catch(() => "");
    return { ok: false, status: res.status, error: t || res.statusText };
  }
  const data = await res.json().catch(() => ({}));
  return { ok: true, status: res.status, data };
}

export async function postInviteTenantUsers(
  tenantId: string,
  payload: unknown,
): Promise<{ ok: boolean; status: number; data?: unknown; error?: string }> {
  const res = await apiFetch(`/api/v2/admin/tenants/${encodeURIComponent(tenantId)}/users/invite`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const t = await res.text().catch(() => "");
    return { ok: false, status: res.status, error: t || res.statusText };
  }
  const data = await res.json().catch(() => ({}));
  return { ok: true, status: res.status, data };
}
