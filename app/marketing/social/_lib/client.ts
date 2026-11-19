import { apiFetch } from "@/lib/api/fetch-client";
import type { Brand, CapabilityCell, ConnectionStart, Result, SocialAccount, SocialClient } from "./types";

const BASE = "/api/v1/social";

function uuid(): string {
  const c = typeof crypto !== "undefined" ? crypto : undefined;
  if (c && "randomUUID" in c) return c.randomUUID();
  return `k-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

/**
 * Cliente tipado de C-SOCIAL-D0. X-Tenant-ID es el tenant del JWT (el backend lo contrasta con el claim);
 * ninguna peticion lleva tenant en el cuerpo. Nunca lanza: cualquier fallo es {ok:false}.
 */
export function createSocialClient(opts: { tenantId: string | null | undefined; fetchFn?: typeof fetch }): SocialClient {
  const tenant = (opts.tenantId || "").trim();
  const f = opts.fetchFn ?? ((u: string, i?: RequestInit) => apiFetch(u, i));

  async function call<T>(method: string, path: string, body?: unknown, extra: Record<string, string> = {}): Promise<Result<T>> {
    if (!tenant) return { ok: false, status: 401, code: "TENANT_REQUIRED" };
    const headers: Record<string, string> = { Accept: "application/json", "X-Tenant-ID": tenant, ...extra };
    if (method !== "GET") headers["Idempotency-Key"] = uuid();
    if (body !== undefined) headers["Content-Type"] = "application/json";
    try {
      const r = await f(`${BASE}${path}`, {
        method,
        headers,
        body: body === undefined ? undefined : JSON.stringify(body),
        cache: "no-store",
      } as RequestInit);
      const j: unknown = await r.json().catch(() => null);
      if (!r.ok || j === null || typeof j !== "object") {
        const code = j && typeof j === "object" ? (j as { code?: string }).code : undefined;
        return { ok: false, status: r.status, code };
      }
      return { ok: true, data: j as T };
    } catch {
      return { ok: false, status: 0 };
    }
  }

  const items = <T,>(r: Result<{ items?: T[] }>): Result<T[]> =>
    r.ok === false ? { ok: false, status: r.status, code: r.code } : Array.isArray(r.data.items) ? { ok: true, data: r.data.items } : { ok: false, status: 502 };

  return {
    async listBrands() {
      return items<Brand>(await call("GET", "/brands?limit=100"));
    },
    async listAccounts(brandId) {
      return items<SocialAccount>(await call("GET", `/accounts?limit=100&brand_id=${encodeURIComponent(brandId)}`));
    },
    async getCapabilities() {
      const r = await call<{ cells?: CapabilityCell[] }>("GET", "/capabilities");
      if (r.ok === false) return { ok: false, status: r.status, code: r.code };
      return Array.isArray(r.data.cells) ? { ok: true, data: r.data.cells } : { ok: false, status: 502 };
    },
    createAccount: (body) => call<SocialAccount>("POST", "/accounts", body),
    updateAccount: (id, version, patch) =>
      call<SocialAccount>("PATCH", `/accounts/${encodeURIComponent(id)}`, patch, { "If-Match": String(version) }),
    transition: (id, version, body) =>
      call<SocialAccount>("POST", `/accounts/${encodeURIComponent(id)}/transitions`, body, { "If-Match": String(version) }),
    startConnection: (id, purpose = "identity") =>
      call<ConnectionStart>("POST", `/accounts/${encodeURIComponent(id)}/connection/start`, { purpose }),
  };
}
