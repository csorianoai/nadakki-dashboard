import { apiFetch } from "@/lib/api/fetch-client";
import { OPERATIONS_PATH } from "@/lib/realtor/operaciones/api";

/** Escritura de P3 (ROP-P3-OPERACION-API / DOCUMENTOS-API / REVISION-API). El tenant y el usuario salen del token: nunca viajan. */
const BASE = "/api/v1/realestate";
export type Result = { ok: true } | { ok: false; status: number };
export type Milestone = { id: string; label: string; position: number; required: boolean; status: string };
export type MilestoneEvent = { milestoneId: string; from: string; to: string; actor: string; at: string };
export type Detail = { id: string; status: string; milestones: Milestone[]; events: MilestoneEvent[] };
export type OpenInput = { propertyId: string; templateId: string; contactId?: string; price?: string; currency?: string };

type Obj = Record<string, unknown>;
const isObj = (v: unknown): v is Obj => typeof v === "object" && v !== null && !Array.isArray(v);
const JSON_H = { Accept: "application/json", "Content-Type": "application/json" };

async function send(path: string, method: string, body?: BodyInit, headers: Record<string, string> = JSON_H): Promise<{ status: number; res?: Response }> {
  try {
    const res = await apiFetch(path, { method, cache: "no-store", headers, body });
    return { status: res.status, res };
  } catch {
    return { status: 0 };
  }
}
const done = (s: number, ok: number[]): Result => (ok.includes(s) ? { ok: true } : { ok: false, status: s });

export async function openOperation(i: OpenInput): Promise<{ ok: true; id: string } | { ok: false; status: number }> {
  const body: Obj = { kind: "rental", property_id: i.propertyId, template_id: i.templateId };
  if (i.price && i.currency) body.agreed_price = { amount: i.price, currency: i.currency };
  if (i.contactId) body.parties = [{ contact_id: i.contactId, role: "tenant" }];
  const { status, res } = await send(OPERATIONS_PATH, "POST", JSON.stringify(body));
  if (status !== 201 || !res) return { ok: false, status };
  const b: unknown = await res.json().catch(() => null);
  return isObj(b) && typeof b.id === "string" ? { ok: true, id: b.id } : { ok: false, status };
}

export async function fetchTemplates(): Promise<{ id: string; name: string }[]> {
  const { status, res } = await send(`${BASE}/operation-templates?kind=rental&limit=100`, "GET");
  if (status !== 200 || !res) return [];
  const b: unknown = await res.json().catch(() => null);
  if (!isObj(b) || !Array.isArray(b.items)) return [];
  return b.items.filter((t): t is Obj => isObj(t) && t.is_active === true && typeof t.id === "string" && typeof t.name === "string").map((t) => ({ id: t.id as string, name: t.name as string }));
}

export async function fetchDetail(id: string): Promise<Detail | null> {
  const { status, res } = await send(`${OPERATIONS_PATH}/${encodeURIComponent(id)}`, "GET");
  if (status !== 200 || !res) return null;
  const b: unknown = await res.json().catch(() => null);
  if (!isObj(b) || !isObj(b.operation) || !Array.isArray(b.milestones)) return null;
  const milestones = b.milestones
    .filter((m): m is Obj => isObj(m) && typeof m.id === "string" && typeof m.label === "string" && typeof m.status === "string")
    .map((m) => ({ id: m.id as string, label: m.label as string, position: Number(m.position) || 0, required: m.required === true, status: m.status as string }))
    .sort((a, c) => a.position - c.position);
  const ids = new Set(milestones.map((m) => m.id));
  const raw: unknown[] = Array.isArray(b.milestone_events) ? b.milestone_events : [];
  const events = raw
    .filter((e): e is Obj => isObj(e) && [e.milestone_id, e.from_status, e.to_status, e.actor_user_id, e.occurred_at].every((v) => typeof v === "string" && v !== "") && ids.has(e.milestone_id as string) && !Number.isNaN(Date.parse(e.occurred_at as string)))
    .map((e) => ({ milestoneId: e.milestone_id as string, from: e.from_status as string, to: e.to_status as string, actor: e.actor_user_id as string, at: e.occurred_at as string }))
    .sort((a, c) => Date.parse(a.at) - Date.parse(c.at));
  return { id, status: String(b.operation.status), milestones, events };
}

export async function setMilestone(opId: string, milestoneId: string, status: string, skipReason?: string): Promise<Result> {
  const body: Obj = { status };
  if (status === "skipped" && skipReason) body.skip_reason = skipReason;
  return done((await send(`${OPERATIONS_PATH}/${encodeURIComponent(opId)}/milestones/${encodeURIComponent(milestoneId)}`, "PATCH", JSON.stringify(body))).status, [200]);
}

/** POST /documents: bytes en el cuerpo y metadatos en la query (sin multipart). */
export async function uploadDocument(opId: string, file: File, docType: string, title: string): Promise<Result> {
  const q = new URLSearchParams({ subject_type: "operation", subject_id: opId, doc_type: docType, title, file_name: file.name });
  return done((await send(`${BASE}/documents?${q}`, "POST", file, { Accept: "application/json", "Content-Type": file.type || "application/octet-stream" })).status, [201]);
}

export async function sendToReview(opId: string): Promise<Result> {
  return done((await send(`${BASE}/broker-desk/items`, "POST", JSON.stringify({ operation_id: opId }))).status, [201]);
}
