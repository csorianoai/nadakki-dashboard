import { BANK_ANALYST_ROLE_HEADER } from "@/lib/bank-application-detail/constants";
import { BankApplicationAuthError, BankApplicationHttpError } from "@/lib/bank-application-detail/errors";
import { readBankApplicationAuthToken } from "@/lib/bank-application-detail/fetch-detail";
import { decodeJwtTid } from "@/lib/bank-application-detail/jwt";
import type { BankDecideRequestBody, BankDecideResponse } from "@/lib/bank-decision/types";
import { tokenStorage } from "@/lib/auth/token-storage";

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

function normalizeDecideBody(input: BankDecideRequestBody): BankDecideRequestBody {
  const legacy = input as BankDecideRequestBody & { justification?: unknown; lender_code?: unknown };
  const reasonCodes = input.reason_codes.length > 0
    ? input.reason_codes
    : input.decision_type === "REJECT"
      ? ["RC101_REJECT_CREDIT_POLICY"]
      : input.decision_type === "COUNTER"
        ? ["RC201_COUNTER_AMOUNT"]
        : ["RC001_APPROVE"];
  const notes = input.notes ?? (typeof legacy.justification === "string" ? legacy.justification : undefined);

  return {
    decision_type: input.decision_type,
    reason_codes: reasonCodes,
    ...(input.stipulations ? { stipulations: input.stipulations } : {}),
    ...(input.counter_terms ? { counter_terms: input.counter_terms } : {}),
    ...(input.approved_terms ? { approved_terms: input.approved_terms } : {}),
    ...(input.adverse_action !== undefined ? { adverse_action: input.adverse_action } : {}),
    ...(notes !== undefined ? { notes } : {}),
  };
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
  // Credit Hub auth fallback: try auth v2 (tokenStorage) first, then legacy localStorage
  const token = tokenStorage.getAccessToken() || readBankApplicationAuthToken();
  if (!token) throw new BankApplicationAuthError();
  const idem = init?.idempotencyKey ?? newIdempotencyKey();
  const url = `/api/v2/credit/applications/${encodeURIComponent(applicationId)}/decide`;
  const res = await fetch(url, {
    method: "POST",
    headers: buildDecideHeaders(token, actorId, idem),
    body: JSON.stringify(normalizeDecideBody(body)),
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
