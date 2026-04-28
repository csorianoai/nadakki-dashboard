"use client";

import { throwIfChFeatureDisabled } from "../utils/featureDisabled";

export class TenantRequiredError extends Error {
  constructor() {
    super("Tenant ID required");
    this.name = "TenantRequiredError";
  }
}

export class CHApiError extends Error {
  constructor(public detail: string, public status: number) {
    super(detail);
    this.name = "CHApiError";
  }
}

export class CHMutationForbiddenError extends Error {
  constructor() {
    super("Viewer role cannot perform Credit Hub mutations");
    this.name = "CHMutationForbiddenError";
  }
}

export type CHActorRole = "dealer" | "bank" | "bank_analyst" | "bank_admin" | "compliance_officer" | "customer" | "admin";

export interface CHRequestInit extends Omit<RequestInit, "headers"> {
  tenantId: string;
  actorRole: CHActorRole;
  idempotencyKey?: string;
  headers?: Record<string, string>;
}

const SIC_TOKEN_KEY = "nadakki_sic_token";
const DASHBOARD_ROLE_KEY = "nadakki_role";

function getLocalStorageItem(key: string): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(key);
}

function isMutationMethod(method: string): boolean {
  return ["POST", "PUT", "PATCH", "DELETE"].includes(method);
}

function randomUUID(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return "10000000-1000-4000-8000-100000000000".replace(/[018]/g, (c) =>
    (
      Number(c) ^
      (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (Number(c) / 4)))
    ).toString(16)
  );
}

function responseMessage(body: unknown, fallback: string): string {
  const detail =
    body && typeof body === "object" && "detail" in body
      ? (body as { detail?: unknown }).detail
      : undefined;
  if (typeof detail === "string") return detail;
  if (detail && typeof detail === "object") return JSON.stringify(detail);
  return fallback;
}

async function parseResponseBody(response: Response): Promise<unknown> {
  try {
    return await response.clone().json();
  } catch {
    return null;
  }
}

function redirectToLogin(): void {
  if (typeof window === "undefined") return;
  window.location.href = "/login?next=" + encodeURIComponent(window.location.pathname);
}

export async function chFetch<T>(path: string, init: CHRequestInit): Promise<T> {
  if (!init.tenantId) throw new TenantRequiredError();

  const method = (init.method ?? "GET").toUpperCase();
  const isMutation = isMutationMethod(method);
  const dashboardRole = getLocalStorageItem(DASHBOARD_ROLE_KEY);
  if (isMutation && dashboardRole === "viewer") {
    throw new CHMutationForbiddenError();
  }

  const idemKey = init.idempotencyKey ?? (isMutation ? randomUUID() : undefined);
  const sicToken = getLocalStorageItem(SIC_TOKEN_KEY);
  const headers: Record<string, string> = {
    "X-Tenant-ID": init.tenantId,
    "X-Actor-Role": init.actorRole,
    ...(sicToken ? { Authorization: `Bearer ${sicToken}` } : {}),
    ...(idemKey ? { "Idempotency-Key": idemKey } : {}),
    ...(init.body ? { "Content-Type": "application/json" } : {}),
    ...(init.headers ?? {}),
  };

  const isRetry = headers["X-CH-Retry"] === "1";
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30_000);

  try {
    const response = await fetch(path, {
      ...init,
      method,
      headers,
      signal: controller.signal,
      credentials: "include",
    });

    const body = await parseResponseBody(response);
    throwIfChFeatureDisabled(response.status, body);

    if (response.status === 401) {
      redirectToLogin();
      throw new CHApiError("Unauthorized", 401);
    }

    if (response.status >= 500 && response.status < 600 && !isRetry) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      return chFetch<T>(path, {
        ...init,
        headers: { ...headers, "X-CH-Retry": "1" },
      });
    }

    if (!response.ok) {
      throw new CHApiError(responseMessage(body, response.statusText), response.status);
    }

    return body as T;
  } finally {
    clearTimeout(timeoutId);
  }
}
