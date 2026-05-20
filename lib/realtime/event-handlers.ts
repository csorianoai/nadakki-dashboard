import type { ApplicationRealtimePayload, RealtimeEnvelope, RealtimeApplicationEvent } from "@/types/realtime";

export interface QueueApplicationRow {
  application_id: string;
  tenant_id?: string;
  state: string;
  applicant_name?: string;
  vehicle_label?: string;
  requested_amount?: number;
  score?: number;
  risk_level?: string;
  approval_band?: string;
  priority?: string;
  created_at?: string;
  bank_decision?: unknown;
  updated_at?: string;
}

function asRecord(v: unknown): Record<string, unknown> | null {
  return v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : null;
}

/** Parse WebSocket text frame into a normalized event (best-effort for evolving backends). */
export function parseRealtimeMessage(raw: string): RealtimeApplicationEvent | null {
  try {
    const j = JSON.parse(raw) as unknown;
    const rec = asRecord(j);
    if (!rec) return { kind: "unknown", raw: j };

    const type = String(rec.type ?? rec.event ?? "").toLowerCase();

    if (type === "ping") return { kind: "ping" };
    if (type === "pong") return { kind: "pong" };

    if (type.includes("offer") || type === "credit.offer") {
      const appId = String(rec.application_id ?? rec.applicationId ?? "");
      const offer = asRecord(rec.offer) ?? rec;
      if (appId) return { kind: "offer.received", application_id: appId, offer: offer ?? {} };
    }

    if (type.includes("decision") || type === "credit.decision") {
      const appId = String(rec.application_id ?? rec.applicationId ?? "");
      const decision = asRecord(rec.decision) ?? rec;
      if (appId) return { kind: "decision.made", application_id: appId, decision: decision ?? {} };
    }

    if (type.includes("stipulation")) {
      const appId = String(rec.application_id ?? rec.applicationId ?? "");
      if (appId) {
        return {
          kind: "stipulations.updated",
          application_id: appId,
          message: typeof rec.message === "string" ? rec.message : undefined,
        };
      }
    }

    if (type.includes("aggregat")) {
      const appId = String(rec.application_id ?? rec.applicationId ?? "");
      if (appId) {
        return {
          kind: "aggregation.updated",
          application_id: appId,
          summary: asRecord(rec.summary) ?? undefined,
        };
      }
    }

    const payload = asRecord(rec.payload);
    const appFromPayload = payload ? (asRecord(payload.application) ?? payload) : null;

    if (type === "application.created" || type.endsWith(".created")) {
      const application = normalizeApplication(appFromPayload ?? rec);
      return { kind: "application.created", application };
    }

    if (
      type === "application.updated" ||
      type.endsWith(".updated") ||
      type.includes("application") ||
      rec.application_id
    ) {
      const application = normalizeApplication(appFromPayload ?? rec);
      if (application.application_id || (payload && (payload.application_id ?? rec.application_id))) {
        return {
          kind: "application.updated",
          application: {
            ...application,
            application_id:
              application.application_id ??
              String(payload?.application_id ?? rec.application_id ?? ""),
          },
        };
      }
    }

    return { kind: "unknown", raw: j };
  } catch {
    return null;
  }
}

function normalizeApplication(rec: Record<string, unknown>): ApplicationRealtimePayload {
  return {
    application_id: String(rec.application_id ?? rec.applicationId ?? rec.id ?? ""),
    tenant_id: rec.tenant_id != null ? String(rec.tenant_id) : undefined,
    state: rec.state != null ? String(rec.state) : undefined,
    applicant_name: rec.applicant_name != null ? String(rec.applicant_name) : undefined,
    vehicle_label: rec.vehicle_label != null ? String(rec.vehicle_label) : undefined,
    score: typeof rec.score === "number" ? rec.score : undefined,
    approval_band: rec.approval_band != null ? String(rec.approval_band) : undefined,
    bank_decision: rec.bank_decision,
    priority: rec.priority != null ? String(rec.priority) : undefined,
    updated_at: rec.updated_at != null ? String(rec.updated_at) : new Date().toISOString(),
  };
}

/** Merge a realtime application patch into the queue list (dedupe by application_id). */
export function mergeQueueApplications(
  current: QueueApplicationRow[],
  patch: ApplicationRealtimePayload,
  mode: "prepend" | "update",
): QueueApplicationRow[] {
  const id = patch.application_id?.trim();
  if (!id) return current;

  const existing = current.find((r) => r.application_id === id);
  const nextRow: QueueApplicationRow = {
    application_id: id,
    tenant_id: patch.tenant_id ?? existing?.tenant_id,
    state: patch.state ?? existing?.state ?? "pending",
    applicant_name: patch.applicant_name ?? existing?.applicant_name,
    vehicle_label: patch.vehicle_label ?? existing?.vehicle_label,
    requested_amount: existing?.requested_amount,
    score: patch.score ?? existing?.score,
    risk_level: existing?.risk_level,
    approval_band: patch.approval_band ?? existing?.approval_band,
    priority: patch.priority ?? existing?.priority,
    created_at: existing?.created_at,
    bank_decision: patch.bank_decision !== undefined ? patch.bank_decision : existing?.bank_decision,
    updated_at: patch.updated_at ?? new Date().toISOString(),
  };

  const others = current.filter((r) => r.application_id !== id);

  if (mode === "prepend") {
    return [nextRow, ...others];
  }

  const idx = current.findIndex((r) => r.application_id === id);
  if (idx === -1) {
    return [nextRow, ...current];
  }
  const copy = [...current];
  copy[idx] = nextRow;
  return copy;
}

/** Narrow envelope-style messages ({ type, channel, payload }). */
export function parseRealtimeEnvelope(raw: string): RealtimeEnvelope | null {
  try {
    const j = JSON.parse(raw) as RealtimeEnvelope;
    if (!j || typeof j !== "object") return null;
    return j;
  } catch {
    return null;
  }
}

export function eventToMergeMode(ev: RealtimeApplicationEvent): "prepend" | "update" | null {
  if (ev.kind === "application.created") return "prepend";
  if (ev.kind === "application.updated") return "update";
  return null;
}
