import {
  buildBankApplicationDetailHeadersWithRole,
  readBankApplicationAuthToken,
} from "@/lib/bank-application-detail/fetch-detail";
import { BankApplicationAuthError, BankApplicationHttpError } from "@/lib/bank-application-detail/errors";
import { tokenStorage } from "@/lib/auth/token-storage";
import type {
  CreditStipulation,
  StipulationAuditEntry,
  StipulationCreatePayload,
  StipulationStatus,
  StipulationUploadLinkResult,
  StipulationsApiRole,
} from "@/lib/api/stipulations-types";
import { resolveStipulationsApiRoleFromStorage } from "@/lib/bank/stipulations/resolve-role";

function baseUrl(applicationId: string): string {
  return `/api/v2/credit/applications/${encodeURIComponent(applicationId)}`;
}

function parseJsonBody(res: Response): Promise<unknown> {
  return res.json().catch(() => null);
}

function unwrapArray(body: unknown, keys: string[]): unknown[] {
  if (Array.isArray(body)) return body;
  if (body && typeof body === "object") {
    const o = body as Record<string, unknown>;
    for (const k of keys) {
      const v = o[k];
      if (Array.isArray(v)) return v;
    }
    const inner = o.data;
    if (inner && typeof inner === "object" && !Array.isArray(inner)) {
      const d = inner as Record<string, unknown>;
      for (const k of keys) {
        const v = d[k];
        if (Array.isArray(v)) return v;
      }
    }
    if (Array.isArray(inner)) return inner;
  }
  return [];
}

function normalizeStatus(raw: string | undefined): StipulationStatus {
  const s = (raw ?? "").toLowerCase();
  if (s === "uploaded" || s === "received" || s === "submitted") return "uploaded";
  if (s === "verified" || s === "approved" || s === "complete") return "verified";
  if (s === "rejected" || s === "declined") return "rejected";
  return "pending";
}

function normalizeStipulationRow(row: unknown): CreditStipulation | null {
  if (!row || typeof row !== "object") return null;
  const o = row as Record<string, unknown>;
  const id = o.id ?? o.stipulation_id ?? o.uuid;
  if (typeof id !== "string" || !id.trim()) return null;
  const description =
    (typeof o.description === "string" && o.description) ||
    (typeof o.title === "string" && o.title) ||
    (typeof o.name === "string" && o.name) ||
    "Estipulación";
  return {
    id: id.trim(),
    application_id: typeof o.application_id === "string" ? o.application_id : undefined,
    title: typeof o.title === "string" ? o.title : undefined,
    description,
    status: normalizeStatus(typeof o.status === "string" ? o.status : undefined),
    document_id: typeof o.document_id === "string" ? o.document_id : undefined,
    document_mime: typeof o.document_mime === "string" ? o.document_mime : undefined,
    uploaded_at: typeof o.uploaded_at === "string" ? o.uploaded_at : undefined,
    verified_at: typeof o.verified_at === "string" ? o.verified_at : undefined,
    rejected_at: typeof o.rejected_at === "string" ? o.rejected_at : undefined,
    reject_reason: typeof o.reject_reason === "string" ? o.reject_reason : undefined,
    notes: typeof o.notes === "string" ? o.notes : undefined,
    type: typeof o.type === "string" ? o.type : undefined,
    dealer_id:
      typeof o.dealer_id === "string"
        ? o.dealer_id
        : typeof (o as { dealerId?: unknown }).dealerId === "string"
          ? String((o as { dealerId?: string }).dealerId)
          : undefined,
    sla_deadline: typeof o.sla_deadline === "string" ? o.sla_deadline : undefined,
  };
}

async function creditJson(
  applicationId: string,
  pathSuffix: string,
  init: RequestInit,
  role: StipulationsApiRole,
): Promise<Response> {
  // Credit Hub auth fallback: try auth v2 (tokenStorage) first, then legacy localStorage
  const token = tokenStorage.getAccessToken() || readBankApplicationAuthToken();
  if (!token) throw new BankApplicationAuthError();

  const url = `${baseUrl(applicationId)}${pathSuffix}`;
  const headers: HeadersInit = {
    Accept: "application/json",
    "Content-Type": "application/json",
    ...buildBankApplicationDetailHeadersWithRole(token, role),
    ...(init.headers ?? {}),
  };

  return fetch(url, {
    ...init,
    headers,
    credentials: "include",
    cache: "no-store",
  });
}

function assertOk(res: Response, body: unknown): void {
  if (res.ok) return;
  const code =
    body && typeof body === "object" && "code" in body ? String((body as { code?: unknown }).code) : undefined;
  const msg =
    body && typeof body === "object" && "message" in body
      ? String((body as { message?: unknown }).message)
      : res.statusText;
  throw new BankApplicationHttpError(msg ?? `HTTP ${res.status}`, res.status, code);
}

export async function getStipulations(
  applicationId: string,
  role: StipulationsApiRole = resolveStipulationsApiRoleFromStorage(),
): Promise<CreditStipulation[]> {
  const res = await creditJson(applicationId, "/stipulations", { method: "GET" }, role);
  const body = await parseJsonBody(res);
  if (!res.ok) {
    assertOk(res, body);
    return [];
  }
  const rows = unwrapArray(body, ["stipulations", "items", "results"]);
  return rows.map(normalizeStipulationRow).filter((x): x is CreditStipulation => x != null);
}

export async function verifyStipulation(
  applicationId: string,
  stipulationId: string,
  notes: string | undefined,
  role: StipulationsApiRole = resolveStipulationsApiRoleFromStorage(),
): Promise<CreditStipulation | null> {
  const res = await creditJson(
    applicationId,
    `/stipulations/${encodeURIComponent(stipulationId)}/clear`,
    {
      method: "POST",
      body: JSON.stringify({ reason: notes?.trim() || undefined, manual_override: Boolean(notes?.trim()) }),
    },
    role,
  );
  const body = await parseJsonBody(res);
  assertOk(res, body);
  const row =
    body && typeof body === "object"
      ? (body as Record<string, unknown>).data ?? (body as Record<string, unknown>).stipulation ?? body
      : null;
  return normalizeStipulationRow(row);
}

export async function rejectStipulation(
  applicationId: string,
  stipulationId: string,
  reason: string,
  role: StipulationsApiRole = resolveStipulationsApiRoleFromStorage(),
): Promise<CreditStipulation | null> {
  const r = reason.trim();
  if (!r) throw new BankApplicationHttpError("reason_required", 400, "reason_required");
  const res = await creditJson(
    applicationId,
    `/stipulations/${encodeURIComponent(stipulationId)}/reject`,
    { method: "POST", body: JSON.stringify({ reason: r }) },
    role,
  );
  const body = await parseJsonBody(res);
  assertOk(res, body);
  const row =
    body && typeof body === "object"
      ? (body as Record<string, unknown>).data ?? (body as Record<string, unknown>).stipulation ?? body
      : null;
  return normalizeStipulationRow(row);
}

export async function createStipulation(
  applicationId: string,
  payload: StipulationCreatePayload,
  role: StipulationsApiRole = resolveStipulationsApiRoleFromStorage(),
): Promise<CreditStipulation | null> {
  const bodyPayload: Record<string, unknown> = {
    type: payload.type.trim(),
    dealer_id: payload.dealer_id.trim(),
  };
  if (payload.description?.trim()) bodyPayload.description = payload.description.trim();
  if (payload.sla_hours != null && payload.sla_hours > 0) bodyPayload.sla_hours = payload.sla_hours;

  const res = await creditJson(
    applicationId,
    "/stipulations",
    { method: "POST", body: JSON.stringify(bodyPayload) },
    role,
  );
  const body = await parseJsonBody(res);
  assertOk(res, body);
  const row =
    body && typeof body === "object"
      ? (body as Record<string, unknown>).data ?? (body as Record<string, unknown>).stipulation ?? body
      : null;
  return normalizeStipulationRow(row);
}

export async function postStipulationUploadLink(
  applicationId: string,
  stipulationId: string,
  role: StipulationsApiRole = resolveStipulationsApiRoleFromStorage(),
): Promise<StipulationUploadLinkResult> {
  const res = await creditJson(
    applicationId,
    `/stipulations/${encodeURIComponent(stipulationId)}/upload-link`,
    { method: "POST", body: "{}" },
    role,
  );
  const body = await parseJsonBody(res);
  assertOk(res, body);
  if (!body || typeof body !== "object") {
    throw new BankApplicationHttpError("invalid_upload_link_response", 500);
  }
  const o = body as Record<string, unknown>;
  const sid = o.stipulation_id;
  const upload = o.upload_url;
  const tok = o.token;
  const exp = o.expires_at;
  const qr = o.qr_payload;
  if (typeof sid !== "string" || typeof upload !== "string" || typeof tok !== "string" || typeof exp !== "string") {
    throw new BankApplicationHttpError("invalid_upload_link_shape", 500);
  }
  return {
    stipulation_id: sid,
    upload_url: upload,
    token: tok,
    expires_at: typeof exp === "string" ? exp : String(exp),
    qr_payload: typeof qr === "string" ? qr : "",
  };
}

export async function getStipulationAudit(
  applicationId: string,
  stipulationId: string,
  role: StipulationsApiRole = resolveStipulationsApiRoleFromStorage(),
): Promise<StipulationAuditEntry[]> {
  const res = await creditJson(
    applicationId,
    `/stipulations/${encodeURIComponent(stipulationId)}/audit`,
    { method: "GET" },
    role,
  );
  const body = await parseJsonBody(res);
  if (!res.ok) {
    assertOk(res, body);
    return [];
  }
  const raw = unwrapArray(body, ["events", "items", "audit", "entries"]);
  const out: StipulationAuditEntry[] = [];
  for (const row of raw) {
    if (!row || typeof row !== "object") continue;
    const o = row as Record<string, unknown>;
    const id = typeof o.id === "string" ? o.id : `evt-${out.length}`;
    const at =
      (typeof o.at === "string" && o.at) ||
      (typeof o.ts === "string" && o.ts) ||
      (typeof o.created_at === "string" && o.created_at) ||
      new Date().toISOString();
    const action =
      (typeof o.action === "string" && o.action) ||
      (typeof o.type === "string" && o.type) ||
      (typeof o.event === "string" && o.event) ||
      "event";
    out.push({
      id,
      at,
      actor: typeof o.actor === "string" ? o.actor : typeof o.user === "string" ? o.user : undefined,
      action,
      detail:
        (typeof o.detail === "string" && o.detail) ||
        (typeof o.message === "string" && o.message) ||
        (typeof o.summary === "string" && o.summary) ||
        undefined,
    });
  }
  return out;
}

/**
 * Agent-4 / META MVP: notifies dealer Analyst UI that new stipulations are pending review.
 * Fails softly when Agent-2 has not wired the endpoint yet (404/405/501).
 */
export async function notifyDealerStipulationWorkflow(
  applicationId: string,
  stipulation_ids: string[],
  role: StipulationsApiRole = resolveStipulationsApiRoleFromStorage(),
): Promise<{ ok: boolean; unsupported?: boolean }> {
  const res = await creditJson(
    applicationId,
    "/stipulations/workflow-notify-dealer",
    {
      method: "POST",
      body: JSON.stringify({ stipulation_ids }),
    },
    role,
  );
  if (res.status === 404 || res.status === 405 || res.status === 501) {
    return { ok: false, unsupported: true };
  }
  const body = await parseJsonBody(res);
  if (!res.ok) {
    return { ok: false };
  }
  assertOk(res, body);
  return { ok: true };
}

/** Download stipulation proof (PDF/image). Returns blob; caller revokes object URLs. */
export async function getDocument(
  applicationId: string,
  stipulationId: string,
  tokenParam?: string,
  role: StipulationsApiRole = resolveStipulationsApiRoleFromStorage(),
): Promise<Blob> {
  const token = readBankApplicationAuthToken();
  if (!token) throw new BankApplicationAuthError();

  const q = tokenParam ? `?token=${encodeURIComponent(tokenParam)}` : "";
  const url = `${baseUrl(applicationId)}/stipulations/${encodeURIComponent(stipulationId)}/document${q}`;
  const res = await fetch(url, {
    method: "GET",
    headers: {
      Accept: "application/pdf,image/*,*/*",
      ...buildBankApplicationDetailHeadersWithRole(token, role),
    },
    credentials: "include",
    cache: "no-store",
  });
  if (!res.ok) {
    const body = await parseJsonBody(res);
    assertOk(res, body);
  }
  return res.blob();
}
