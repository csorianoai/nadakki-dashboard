/**
 * Monetización backend client — /api/v2/monetizacion/* (Auth V2 JWT).
 * Used when NEXT_PUBLIC_FM_USE_API=true (staging/production).
 */
import { tokenStorage } from "@/lib/auth/token-storage";

const LEGACY_TOKEN_KEY = "nadakki_sic_token";

function apiBase(): string {
  if (typeof window !== "undefined") {
    return "";
  }
  return (
    process.env.NEXT_PUBLIC_NADAKKI_API_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    process.env.NEXT_PUBLIC_API_BASE_URL ||
    ""
  );
}

function bearer(): string | null {
  const v2 = tokenStorage.getAccessToken();
  if (v2) return v2;
  if (typeof window !== "undefined") {
    return window.localStorage.getItem(LEGACY_TOKEN_KEY);
  }
  return null;
}

export class MonetizacionApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
    this.name = "MonetizacionApiError";
  }
}

export async function monetizacionFetch<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const token = bearer();
  if (!token) {
    throw new MonetizacionApiError("Authentication required", 401);
  }
  const url = `${apiBase()}${path.startsWith("/") ? path : `/${path}`}`;
  const resp = await fetch(url, {
    ...init,
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
      ...(init.headers as Record<string, string> | undefined),
    },
  });
  if (!resp.ok) {
    const text = await resp.text().catch(() => "");
    throw new MonetizacionApiError(text || resp.statusText, resp.status);
  }
  return resp.json() as Promise<T>;
}

export type MonetizacionDashboardApi = {
  data_source: string;
  plan: string;
  monthly_limit?: number;
  evaluations_used?: number;
  usage_pct?: number;
  currency: string;
};

export type MonetizacionIngresosApi = {
  data_source: string;
  base_fee?: number;
  total?: number;
  currency: string;
};

export type MonetizacionCostoMargenApi = {
  data_source: string;
  plan: string;
  currency: string;
};

export type MonetizacionEstadoCuentaApi = {
  data_source: string;
  tenant_id: string;
  total?: number;
  currency?: string;
  plan?: string;
};

export type MonetizacionConfigApi = {
  data_source: string;
  tenant_id?: string;
  plan_key?: string;
  monthly_evaluation_limit?: number;
  currency?: string;
};
