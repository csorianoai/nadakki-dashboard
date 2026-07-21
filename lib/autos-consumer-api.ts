/** Autos consumer API client — interceptors + error handling (Phase 6). */

import { resolveApiUrl, getAuthHeaders } from "@/lib/api/fetch-client";
import { isAutosConsumerPublicPath } from "@/lib/autos-portal/routes";

export type ApiErrorCode = 401 | 403 | 404 | 500;

export class AutosApiError extends Error {
  constructor(
    message: string,
    public status: ApiErrorCode | number,
  ) {
    super(message);
    this.name = "AutosApiError";
  }
}

function getTenantId(): string {
  if (typeof window !== "undefined") {
    const stored = window.localStorage.getItem("nadakki_tenant_id");
    if (stored) return stored;
  }
  return (
    process.env.NEXT_PUBLIC_DEFAULT_TENANT_ID ||
    process.env.NEXT_PUBLIC_TENANT_ID ||
    "demo-tenant"
  );
}

let toastHandler: ((msg: string, type?: "error" | "warning") => void) | null = null;

export function registerAutosApiToast(
  handler: (msg: string, type?: "error" | "warning") => void,
) {
  toastHandler = handler;
}

function toast(msg: string, type: "error" | "warning" = "error") {
  toastHandler?.(msg, type);
  if (typeof window !== "undefined" && !toastHandler) {
    console.warn(`[autos-api] ${type}: ${msg}`);
  }
}

export async function autosFetch<T>(
  path: string,
  init: RequestInit = {},
): Promise<T | null> {
  const headers = new Headers(init.headers ?? undefined);
  if (!(init.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }
  headers.set("X-Tenant-ID", getTenantId());

  const onPublicAutos =
    typeof window !== "undefined" &&
    isAutosConsumerPublicPath(window.location.pathname);
  if (typeof window !== "undefined") {
    console.log("🔍 [autosFetch] pathname:", window.location.pathname);
    console.log("🔍 [autosFetch] isPublic:", isAutosConsumerPublicPath(window.location.pathname));
  }
  const auth = onPublicAutos ? {} : getAuthHeaders();
  if (auth.Authorization && !headers.has("Authorization")) {
    headers.set("Authorization", auth.Authorization);
  }
  if (typeof window !== "undefined") {
    console.log("🔍 [autosFetch] auth headers:", auth);
    console.log("🔍 [autosFetch] sending Authorization?", headers.has("Authorization"));
  }

  const url = resolveApiUrl(path);
  const res = await fetch(url, { ...init, headers, credentials: "include" });

  if (res.status === 401) {
    if (typeof window !== "undefined") {
      console.log("🔍 [autosFetch] Got 401");
      console.log("🔍 [autosFetch] will redirect?", !isAutosConsumerPublicPath(window.location.pathname));
    }
    if (typeof window !== "undefined" && isAutosConsumerPublicPath(window.location.pathname)) {
      return null;
    }
    toast("Sesión expirada. Inicia sesión de nuevo.");
    if (typeof window !== "undefined") {
      console.log("🔍 [autosFetch] REDIRECTING TO /login from pathname:", window.location.pathname);
      window.location.href = "/login";
    }
    throw new AutosApiError("Unauthorized", 401);
  }

  if (res.status === 403) {
    toast("Sin permisos para tenant", "warning");
    throw new AutosApiError("Forbidden", 403);
  }

  if (res.status === 404) {
    return null;
  }

  if (res.status >= 500) {
    toast("Error servidor, usando datos demo", "warning");
    throw new AutosApiError("Server error", 500);
  }

  if (!res.ok) {
    throw new AutosApiError(`Request failed: ${res.status}`, res.status);
  }

  if (res.status === 204) return null as T;
  return res.json() as Promise<T>;
}

export const AUTOS_API_BASE =
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.NEXT_PUBLIC_NADAKKI_API_URL ||
  "http://localhost:8000";
