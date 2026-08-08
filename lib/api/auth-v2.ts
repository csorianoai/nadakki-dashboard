export interface LoginRequest {
  email: string;
  password: string;
  tenantSlug?: string;
}

export interface RoleInfo {
  core_name: string;
  role_key: string;
  display_name: string;
}

export interface UserInfo {
  id: string;
  email: string;
  name?: string;
  is_active: boolean;
  mfa_enabled: boolean;
  last_login_at?: string;
}

export interface TenantInfo {
  id: string;
  slug: string;
  display_name: string;
  subscribed_cores: string[];
  /** Demo tenant flag from GET /api/v2/auth/me → current_tenant.is_demo */
  is_demo?: boolean;
}

export interface LoginResponseV2 {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
  user_info: UserInfo;
  tenant_info: TenantInfo;
  active_role: RoleInfo;
  mfa_required: boolean;
}

export interface TokenPayloadV2 {
  sub: string;
  email: string;
  tid: string;
  tslug: string;
  roles: RoleInfo[];
  iat: number;
  exp: number;
}

export interface ApiResult<T> {
  ok: boolean;
  data?: T;
  error?: string;
}

export interface MeResponse {
  user: UserInfo;
  current_tenant: TenantInfo;
  all_tenants: TenantInfo[];
  active_roles: RoleInfo[];
}

export interface RefreshResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
}

export interface SwitchTenantResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  new_tenant: TenantInfo;
  active_roles: RoleInfo[];
}

export interface SwitchRoleResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  active_role: RoleInfo;
}

const BASE_URL = (
  process.env.NEXT_PUBLIC_NADAKKI_API_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  "https://api.nadakki.com"
);

/** Per-request ceiling for session init (/refresh + /me). */
export const AUTH_FETCH_TIMEOUT_MS = 5_000;

/** Login POST can exceed 5s on Render even when /health is warm (~10s observed). */
export const AUTH_LOGIN_TIMEOUT_MS = 30_000;

function formatHttpError(
  url: string,
  status: number,
  statusText: string,
  body: string,
): string {
  const snippet = body.trim().slice(0, 300);
  return `HTTP ${status}${statusText ? ` ${statusText}` : ""} — ${url}${snippet ? ` — ${snippet}` : ""}`;
}

function formatNetworkError(url: string, e: unknown): string {
  if (e instanceof Error && e.name === "AbortError") {
    return `Tiempo de espera agotado — ${url}`;
  }
  const detail = e instanceof Error ? `${e.name}: ${e.message}` : String(e);
  return `Error de red (${detail}) — ${url}`;
}

async function fetchApi<T>(
  endpoint: string,
  options?: RequestInit,
  timeoutMs = AUTH_FETCH_TIMEOUT_MS,
): Promise<ApiResult<T>> {
  const url = `${BASE_URL}${endpoint}`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const r = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        ...(options?.headers as Record<string, string> | undefined),
      },
    });
    if (!r.ok) {
      const body = await r.text();
      return { ok: false, error: formatHttpError(url, r.status, r.statusText, body) };
    }
    return { ok: true, data: (await r.json()) as T };
  } catch (e) {
    return { ok: false, error: formatNetworkError(url, e) };
  } finally {
    clearTimeout(timer);
  }
}

export async function loginV2(
  email: string,
  password: string,
  tenantSlug?: string
): Promise<ApiResult<LoginResponseV2>> {
  return fetchApi<LoginResponseV2>(
    "/api/v2/auth/login",
    {
      method: "POST",
      body: JSON.stringify({
        email,
        password,
        tenant_slug: tenantSlug,
      }),
    },
    AUTH_LOGIN_TIMEOUT_MS,
  );
}

export async function refreshTokenV2(refreshToken: string): Promise<ApiResult<RefreshResponse>> {
  return fetchApi<RefreshResponse>("/api/v2/auth/refresh", {
    method: "POST",
    body: JSON.stringify({ refresh_token: refreshToken }),
  });
}

export async function logoutV2(accessToken: string): Promise<ApiResult<void>> {
  const url = `${BASE_URL}/api/v2/auth/logout`;
  try {
    const r = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
    });
    if (!r.ok) {
      const body = await r.text();
      return { ok: false, error: formatHttpError(url, r.status, r.statusText, body) };
    }
    if (r.status === 204) {
      return { ok: true };
    }
    await r.text();
    return { ok: true };
  } catch (e) {
    return { ok: false, error: formatNetworkError(url, e) };
  }
}

export async function getMeV2(accessToken: string): Promise<ApiResult<MeResponse>> {
  return fetchApi<MeResponse>("/api/v2/auth/me", {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
}

export async function switchTenantV2(
  accessToken: string,
  tenantId?: string,
  tenantSlug?: string
): Promise<ApiResult<SwitchTenantResponse>> {
  const body: { tenant_id?: string; tenant_slug?: string } = {};
  if (tenantId !== undefined) body.tenant_id = tenantId;
  if (tenantSlug !== undefined) body.tenant_slug = tenantSlug;

  return fetchApi<SwitchTenantResponse>("/api/v2/auth/switch-tenant", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(body),
  });
}

export async function switchRoleV2(
  accessToken: string,
  coreName: string,
  roleKey: string
): Promise<ApiResult<SwitchRoleResponse>> {
  return fetchApi<SwitchRoleResponse>("/api/v2/auth/switch-role", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ core_name: coreName, role_key: roleKey }),
  });
}
