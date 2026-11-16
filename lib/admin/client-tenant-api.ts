import { apiFetch } from "@/lib/api/fetch-client";

export type ClientTenantPayload = {
  tenant_name: string;
  slug: string;
  organization_archetype: "client";
  industry: string;
  country_code: string;
  currency: string;
  locale: string;
  cores_enabled: string[];
  admin_email: string;
  admin_password: string;
  external_ref: string;
};

export type ClientTenantResult = {
  tenant_id: string;
  slug: string;
  idempotent: boolean;
};

export type PlatformCore = { core_name: string; display_name: string };

export class ClientTenantApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    public readonly cores: string[],
  ) {
    super(`client-tenant ${status}`);
    this.name = "ClientTenantApiError";
  }
}

function detailOf(body: unknown): Record<string, unknown> {
  const detail = body && typeof body === "object" ? (body as { detail?: unknown }).detail : undefined;
  return detail && typeof detail === "object" ? (detail as Record<string, unknown>) : {};
}

/** Cores that the platform has enabled (same registry the cockpit reads). */
export async function listPlatformCores(): Promise<PlatformCore[]> {
  const response = await apiFetch("/api/v1/cockpit/network/cores");
  if (!response.ok) throw new Error("cores");
  const body = (await response.json()) as {
    cores?: { core_name: string; display_name?: string; enabled?: boolean }[];
  };
  return (body.cores ?? [])
    .filter((core) => core.enabled)
    .map((core) => ({ core_name: core.core_name, display_name: core.display_name || core.core_name }));
}

export async function createClientTenant(payload: ClientTenantPayload): Promise<ClientTenantResult> {
  const response = await apiFetch("/api/v1/admin/client-tenants", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  const body: unknown = await response.json().catch(() => ({}));
  if (!response.ok) {
    const detail = detailOf(body);
    const code = String(detail.error_code ?? detail.code ?? "");
    const cores = Array.isArray(detail.cores) ? detail.cores.map(String) : [];
    throw new ClientTenantApiError(response.status, code, cores);
  }
  const data = body as Partial<ClientTenantResult>;
  return {
    tenant_id: String(data.tenant_id ?? ""),
    slug: String(data.slug ?? payload.slug),
    idempotent: data.idempotent === true,
  };
}
