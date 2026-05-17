import {
  BANK_ANALYST_ROLE_HEADER,
  BANK_QUEUE_AUTH_TOKEN_STORAGE_KEY,
  BANK_QUEUE_DEFAULT_LIMIT,
} from "@/lib/bank-queue/constants";
import { BankQueueAuthError, BankQueueHttpError } from "@/lib/bank-queue/errors";
import { decodeJwtTid } from "@/lib/bank-queue/jwt";
import type { BankQueueApiResponse, BankQueueFetchParams } from "@/lib/bank-queue/types";

function randomCorrelationId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `corr-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function parseDetail(body: unknown): string | undefined {
  if (!body || typeof body !== "object") return undefined;
  const detail = (body as { detail?: unknown }).detail;
  if (typeof detail === "string") return detail;
  if (detail && typeof detail === "object" && "code" in detail) {
    const code = (detail as { code?: unknown }).code;
    if (typeof code === "string") return code;
  }
  return undefined;
}

function parseCode(body: unknown): string | undefined {
  if (!body || typeof body !== "object") return undefined;
  const code = (body as { code?: unknown }).code;
  return typeof code === "string" ? code : undefined;
}

export function readBankAuthToken(): string | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(BANK_QUEUE_AUTH_TOKEN_STORAGE_KEY);
  return raw && raw.trim() ? raw.trim() : null;
}

export function buildBankQueueHeaders(token: string): Record<string, string> {
  const tid = decodeJwtTid(token);
  if (!tid) throw new BankQueueAuthError();
  return {
    Authorization: `Bearer ${token}`,
    "X-Tenant-ID": tid,
    "X-Role": BANK_ANALYST_ROLE_HEADER,
    "X-Correlation-ID": randomCorrelationId(),
  };
}

export async function fetchBankApplicationsQueue(
  params: BankQueueFetchParams,
  init?: RequestInit,
): Promise<BankQueueApiResponse> {
  const token = readBankAuthToken();
  if (!token) throw new BankQueueAuthError();

  const qs = new URLSearchParams();
  qs.set("sort_by", params.sortBy);
  const lim = Math.min(100, Math.max(1, Math.floor(Number(params.limit)) || BANK_QUEUE_DEFAULT_LIMIT));
  qs.set("limit", String(lim));
  qs.set("offset", String(Math.max(0, Math.floor(Number(params.offset)) || 0)));
  if (params.status) qs.set("status", params.status);

  const url = `/api/bank/applications/queue?${qs.toString()}`;
  const headers: HeadersInit = {
    ...buildBankQueueHeaders(token),
    ...(init?.headers ?? {}),
  };

  const res = await fetch(url, {
    ...init,
    method: "GET",
    headers,
    credentials: "include",
    cache: "no-store",
  });

  let body: unknown = null;
  try {
    body = await res.json();
  } catch {
    body = null;
  }

  if (res.ok) {
    return body as BankQueueApiResponse;
  }

  const code = parseCode(body) ?? parseDetail(body);
  const msg =
    typeof body === "object" && body !== null && "message" in body
      ? String((body as { message?: unknown }).message)
      : res.statusText;

  throw new BankQueueHttpError(code ?? msg ?? `HTTP ${res.status}`, res.status, code);
}

export async function postBankApplicationClaim(applicationId: string, signal?: AbortSignal): Promise<Response> {
  const token = readBankAuthToken();
  if (!token) throw new BankQueueAuthError();

  const url = `/api/bank/applications/${encodeURIComponent(applicationId)}/claim`;
  return fetch(url, {
    method: "POST",
    headers: buildBankQueueHeaders(token),
    credentials: "include",
    cache: "no-store",
    signal,
  });
}
