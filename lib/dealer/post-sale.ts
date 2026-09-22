import { accessApiErrorFromHttp } from "@/lib/access/client";
import { apiFetch } from "@/lib/api/fetch-client";

export const POST_SALE_LEGAL_CASES_PATH = "/api/v1/legal/cases";
export const POST_SALE_ASIENTOS_PATH = "/api/v1/contable/asientos";
export const POST_SALE_HEARTBEAT_PATH = "/api/marketing/scheduler/heartbeat";

export type PostSaleCase = { id: string; state: string | null };
export type PostSaleAsiento = { id: string; status: string | null };
export type PostSaleListing = { id: string; status: string | null };
export type PostSaleHeartbeat = Record<string, string | number | boolean>;

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function readTrimmed(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

async function accessGet(path: string, tenantId: string): Promise<unknown> {
  const response = await apiFetch(path, {
    method: "GET",
    headers: { Accept: "application/json", "X-Tenant-ID": tenantId },
  });
  let body: unknown = null;
  try {
    body = await response.json();
  } catch {
    body = null;
  }
  if (!response.ok) throw accessApiErrorFromHttp(response.status, body, path);
  return body;
}

function asList(body: unknown): unknown[] {
  if (Array.isArray(body)) return body;
  const rec = asRecord(body);
  if (!rec) return [];
  if (Array.isArray(rec.cases)) return rec.cases;
  if (Array.isArray(rec.items)) return rec.items;
  if (Array.isArray(rec.vehicles)) return rec.vehicles;
  if (Array.isArray(rec.data)) return rec.data;
  return [];
}

export function parsePostSaleCase(value: unknown): PostSaleCase | null {
  const rec = asRecord(value);
  if (!rec) return null;
  const id = readTrimmed(rec.id) ?? readTrimmed(rec.case_id);
  if (!id) return null;
  return { id, state: readTrimmed(rec.state) };
}

export function parsePostSaleAsiento(value: unknown): PostSaleAsiento | null {
  const rec = asRecord(value);
  if (!rec) return null;
  const id = readTrimmed(rec.id);
  if (!id) return null;
  return { id, status: readTrimmed(rec.status) };
}

export function parsePostSaleListing(value: unknown): PostSaleListing | null {
  const rec = asRecord(value);
  if (!rec) return null;
  const id = readTrimmed(rec.id);
  if (!id) return null;
  return { id, status: readTrimmed(rec.status) };
}

export function parseHeartbeat(value: unknown): PostSaleHeartbeat {
  const rec = asRecord(value);
  if (!rec) return {};
  const out: PostSaleHeartbeat = {};
  for (const [key, raw] of Object.entries(rec)) {
    if (typeof raw === "string" || typeof raw === "number" || typeof raw === "boolean") {
      out[key] = raw;
    }
  }
  return out;
}

export function dealerVehiclesUrl(dealerId: string): string {
  return `/api/v1/autos/dealers/${encodeURIComponent(dealerId)}/vehicles`;
}

export async function fetchPostSaleSnapshot(tenantId: string, dealerId: string | null) {
  const [casesBody, asientosBody, heartbeatBody, listingsBody] = await Promise.all([
    accessGet(POST_SALE_LEGAL_CASES_PATH, tenantId),
    accessGet(POST_SALE_ASIENTOS_PATH, tenantId),
    accessGet(POST_SALE_HEARTBEAT_PATH, tenantId),
    dealerId ? accessGet(dealerVehiclesUrl(dealerId), tenantId) : Promise.resolve([]),
  ]);
  const cases = asList(casesBody)
    .map(parsePostSaleCase)
    .filter((row): row is PostSaleCase => row != null)
    .filter((row) => row.state !== "CLOSED" && row.state !== "ARCHIVED");
  const asientos = asList(asientosBody)
    .map(parsePostSaleAsiento)
    .filter((row): row is PostSaleAsiento => row != null);
  const listings = asList(listingsBody)
    .map(parsePostSaleListing)
    .filter((row): row is PostSaleListing => row != null);
  return {
    cases,
    asientos,
    listings,
    heartbeat: parseHeartbeat(heartbeatBody),
  };
}
