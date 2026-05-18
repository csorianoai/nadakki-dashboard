import {
  BANK_ANALYST_ROLE_HEADER,
  BANK_APPLICATION_AUTH_TOKEN_KEY,
} from "@/lib/bank-application-detail/constants";
import { BankApplicationAuthError, BankApplicationHttpError } from "@/lib/bank-application-detail/errors";
import { decodeJwtTid } from "@/lib/bank-application-detail/jwt";
import type { BankApplicationDetailResponse } from "@/lib/bank-application-detail/types";

function randomCorrelationId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `corr-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function readBankApplicationAuthToken(): string | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(BANK_APPLICATION_AUTH_TOKEN_KEY);
  return raw && raw.trim() ? raw.trim() : null;
}

export function buildBankApplicationDetailHeaders(token: string): Record<string, string> {
  const tid = decodeJwtTid(token);
  if (!tid) throw new BankApplicationAuthError();
  return {
    Authorization: `Bearer ${token}`,
    "X-Tenant-ID": tid,
    "X-Role": BANK_ANALYST_ROLE_HEADER,
    "X-Correlation-ID": randomCorrelationId(),
  };
}

function parseCode(body: unknown): string | undefined {
  if (!body || typeof body !== "object") return undefined;
  const code = (body as { code?: unknown }).code;
  return typeof code === "string" ? code : undefined;
}

function parseDetail(body: unknown): string | undefined {
  if (!body || typeof body !== "object") return undefined;
  const detail = (body as { detail?: unknown }).detail;
  if (typeof detail === "string") return detail;
  return undefined;
}

export async function fetchBankApplicationDetail(
  applicationId: string,
  init?: RequestInit,
): Promise<BankApplicationDetailResponse> {
  const token = readBankApplicationAuthToken();
  if (!token) throw new BankApplicationAuthError();

  const url = `/api/v2/credit/applications/${encodeURIComponent(applicationId)}`;
  const headers: HeadersInit = {
    ...buildBankApplicationDetailHeaders(token),
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
    return body as BankApplicationDetailResponse;
  }

  const code = parseCode(body) ?? parseDetail(body);
  const msg =
    typeof body === "object" && body !== null && "message" in body
      ? String((body as { message?: unknown }).message)
      : res.statusText;

  throw new BankApplicationHttpError(code ?? msg ?? `HTTP ${res.status}`, res.status, code);
}
