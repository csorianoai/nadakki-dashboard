import { apiFetch } from "@/lib/api/fetch-client";

export type OnboardingResult = {
  tenant_id?: string;
  dealer_id?: string;
  entity_id?: string;
  admin_user_id?: string;
  institution_tenant_id?: string;
  onboarding_status: string;
  idempotent?: boolean;
  timing_ms?: number;
};

export class OnboardingApiError extends Error {
  constructor(public readonly status: number, message: string) {
    super(message);
    this.name = "OnboardingApiError";
  }
}

function safeErrorMessage(body: unknown, status: number): string {
  if (body && typeof body === "object" && "detail" in body) {
    const detail = (body as { detail?: unknown }).detail;
    if (typeof detail === "string" && detail.length <= 240) return detail;
    if (detail && typeof detail === "object" && "message" in detail) {
      const message = (detail as { message?: unknown }).message;
      if (typeof message === "string" && message.length <= 240) return message;
    }
  }
  if (status === 409) return "A matching onboarding request already exists.";
  return "The onboarding API could not complete this request.";
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await apiFetch(path, init);
  const body: unknown = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new OnboardingApiError(response.status, safeErrorMessage(body, response.status));
  }
  return body as T;
}

export function createInstitution(payload: unknown): Promise<OnboardingResult> {
  return request("/api/v1/admin/tenants", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function createDealer(payload: unknown): Promise<OnboardingResult> {
  return request("/api/v1/admin/dealers", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function getOnboardingStatus(entityId: string): Promise<OnboardingResult> {
  return request(`/api/v1/admin/onboarding/status/${encodeURIComponent(entityId)}`);
}
