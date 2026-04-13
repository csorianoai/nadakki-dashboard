/**
 * Same-origin calls to Nadakki AI Suite (proxied via next.config rewrites).
 * Contracts mirror backend routers: tenant_onboarding, onboarding_ops, whatsapp, offer_strategy.
 */

const BASE = "";

export type SuiteResult<T> =
  | { ok: true; data: T; status: number }
  | { ok: false; error: string; status: number };

/** Narrows failed suite responses for TypeScript. */
export function suiteFailure<T>(r: SuiteResult<T>): { error: string; status: number } | null {
  if (r.ok === false) {
    return { error: r.error, status: r.status };
  }
  return null;
}

function detailFromJson(json: unknown): string {
  if (json == null) return "Request failed";
  if (typeof json === "object" && json !== null && "detail" in json) {
    const d = (json as { detail: unknown }).detail;
    if (typeof d === "string") return d;
    if (Array.isArray(d))
      return d
        .map((x) => (typeof x === "object" && x && "msg" in x ? String((x as { msg: unknown }).msg) : String(x)))
        .join("; ");
    return JSON.stringify(d);
  }
  return "Request failed";
}

async function parseResponse<T>(res: Response): Promise<SuiteResult<T>> {
  const status = res.status;
  const json = (await res.json().catch(() => null)) as unknown;
  if (!res.ok) {
    return { ok: false as const, error: detailFromJson(json), status };
  }
  return { ok: true as const, data: json as T, status };
}

export async function getTenantOnboardHealth(): Promise<SuiteResult<Record<string, unknown>>> {
  try {
    const res = await fetch(`${BASE}/api/v1/tenants/onboard/health`, { cache: "no-store" });
    return parseResponse<Record<string, unknown>>(res);
  } catch (e) {
    return { ok: false as const, error: (e as Error).message, status: 0 };
  }
}

export type BuildProfileBody = {
  tenant_name: string;
  description?: string;
  website?: string;
  country?: string;
  currency?: string;
  language?: string;
  products?: unknown[];
  locations?: string[];
  tagline?: string;
  usp?: string;
  plan?: string;
};

export async function postBuildProfile(body: BuildProfileBody): Promise<SuiteResult<Record<string, unknown>>> {
  try {
    const res = await fetch(`${BASE}/api/v1/tenants/build-profile`, {
      method: "POST",
      headers: { Accept: "application/json", "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    return parseResponse<Record<string, unknown>>(res);
  } catch (e) {
    return { ok: false as const, error: (e as Error).message, status: 0 };
  }
}

export type OnboardBody = BuildProfileBody & {
  confirm?: boolean;
  dry_run?: boolean;
};

export async function postTenantOnboard(body: OnboardBody): Promise<SuiteResult<Record<string, unknown>>> {
  try {
    const res = await fetch(`${BASE}/api/v1/tenants/onboard`, {
      method: "POST",
      headers: { Accept: "application/json", "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    return parseResponse<Record<string, unknown>>(res);
  } catch (e) {
    return { ok: false as const, error: (e as Error).message, status: 0 };
  }
}

export async function getTenantProfile(tenantId: string): Promise<SuiteResult<Record<string, unknown>>> {
  try {
    const res = await fetch(`${BASE}/api/v1/tenants/${encodeURIComponent(tenantId)}/profile`, {
      cache: "no-store",
    });
    return parseResponse<Record<string, unknown>>(res);
  } catch (e) {
    return { ok: false as const, error: (e as Error).message, status: 0 };
  }
}

export async function postTenantActivate(tenantId: string, force = false): Promise<SuiteResult<Record<string, unknown>>> {
  try {
    const res = await fetch(`${BASE}/api/v1/tenants/activate`, {
      method: "POST",
      headers: { Accept: "application/json", "Content-Type": "application/json" },
      body: JSON.stringify({ tenant_id: tenantId, force }),
    });
    return parseResponse<Record<string, unknown>>(res);
  } catch (e) {
    return { ok: false as const, error: (e as Error).message, status: 0 };
  }
}

export async function getTenantReadiness(tenantId: string): Promise<SuiteResult<Record<string, unknown>>> {
  try {
    const res = await fetch(`${BASE}/api/v1/ops/onboarding/readiness/${encodeURIComponent(tenantId)}`, {
      cache: "no-store",
    });
    return parseResponse<Record<string, unknown>>(res);
  } catch (e) {
    return { ok: false as const, error: (e as Error).message, status: 0 };
  }
}

export async function getFleetReadiness(): Promise<SuiteResult<Record<string, unknown>>> {
  try {
    const res = await fetch(`${BASE}/api/v1/ops/onboarding/readiness`, { cache: "no-store" });
    return parseResponse<Record<string, unknown>>(res);
  } catch (e) {
    return { ok: false as const, error: (e as Error).message, status: 0 };
  }
}

export async function getOpsOnboardingHealth(): Promise<SuiteResult<Record<string, unknown>>> {
  try {
    const res = await fetch(`${BASE}/api/v1/ops/onboarding/health`, { cache: "no-store" });
    return parseResponse<Record<string, unknown>>(res);
  } catch (e) {
    return { ok: false as const, error: (e as Error).message, status: 0 };
  }
}

export async function getWhatsAppConfig(tenantId: string): Promise<SuiteResult<Record<string, unknown>>> {
  try {
    const res = await fetch(`${BASE}/api/v1/whatsapp/config`, {
      cache: "no-store",
      headers: { "X-Tenant-ID": tenantId },
    });
    return parseResponse<Record<string, unknown>>(res);
  } catch (e) {
    return { ok: false as const, error: (e as Error).message, status: 0 };
  }
}

export async function postWhatsAppConfig(
  tenantId: string,
  body: { phone_number_id?: string; verify_token?: string; live_enabled?: boolean }
): Promise<SuiteResult<Record<string, unknown>>> {
  try {
    const res = await fetch(`${BASE}/api/v1/whatsapp/config`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        "X-Tenant-ID": tenantId,
      },
      body: JSON.stringify(body),
    });
    return parseResponse<Record<string, unknown>>(res);
  } catch (e) {
    return { ok: false as const, error: (e as Error).message, status: 0 };
  }
}

export async function postOfferStrategyGenerate(body: {
  tenant_id: string;
  segment?: string;
  product?: string;
  base_price?: string;
  context?: string;
}): Promise<SuiteResult<Record<string, unknown>>> {
  try {
    const res = await fetch(`${BASE}/api/v1/offers/strategy/generate`, {
      method: "POST",
      headers: { Accept: "application/json", "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    return parseResponse<Record<string, unknown>>(res);
  } catch (e) {
    return { ok: false as const, error: (e as Error).message, status: 0 };
  }
}
