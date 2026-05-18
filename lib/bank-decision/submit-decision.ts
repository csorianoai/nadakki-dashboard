import { BANK_ANALYST_ROLE_HEADER } from "@/lib/bank-application-detail/constants";
import { BankApplicationAuthError, BankApplicationHttpError } from "@/lib/bank-application-detail/errors";
import { readBankApplicationAuthToken } from "@/lib/bank-application-detail/fetch-detail";
import { decodeJwtTid } from "@/lib/bank-application-detail/jwt";
import type { BankDecideRequestBody, BankDecideResponse } from "@/lib/bank-decision/types";

function randomCorrelationId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `corr-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function newIdempotencyKey(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `idem-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function buildDecideHeaders(token: string, actorId: string, idempotencyKey: string): Record<string, string> {
  const tid = decodeJwtTid(token);
  if (!tid) throw new BankApplicationAuthError();
  if (!actorId?.trim()) throw new BankApplicationAuthError("Missing X-Actor-ID for decide");
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
    "X-Tenant-ID": tid,
    "X-Role": BANK_ANALYST_ROLE_HEADER,
    "X-Actor-ID": actorId.trim(),
    "Idempotency-Key": idempotencyKey,
    "X-Correlation-ID": randomCorrelationId(),
  };
}

export async function submitBankDecision(
  applicationId: string,
  body: BankDecideRequestBody,
  actorId: string,
  init?: { idempotencyKey?: string; signal?: AbortSignal },
): Promise<BankDecideResponse> {
  const token = readBankApplicationAuthToken();
  if (!token) throw new BankApplicationAuthError();
  const idem = init?.idempotencyKey ?? newIdempotencyKey();
  const url = `/api/v2/credit/applications/${encodeURIComponent(applicationId)}/decide`;
  const res = await fetch(url, {
    method: "POST",
    headers: buildDecideHeaders(token, actorId, idem),
    body: JSON.stringify(body),
    credentials: "include",
    cache: "no-store",
    signal: init?.signal,
  });
  let raw: unknown = null;
  try {
    raw = await res.json();
  } catch {
    raw = null;
  }
  if (res.ok) {
    return raw as BankDecideResponse;
  }
  const code =
    raw && typeof raw === "object" && "code" in raw
      ? String((raw as { code?: unknown }).code)
      : undefined;
  const msg =
    raw && typeof raw === "object" && "message" in raw
      ? String((raw as { message?: unknown }).message)
      : res.statusText;
  throw new BankApplicationHttpError(code ?? msg ?? `HTTP ${res.status}`, res.status, code);
}
