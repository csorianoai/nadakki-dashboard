import { accessApiErrorFromHttp } from "@/lib/access/client";
import { apiFetch } from "@/lib/api/fetch-client";

export const DEALER_INVENTORY_LIST_PATH = "/api/v1/autos/dealers/{dealer_id}/vehicles";

export const PUBLIC_MARKETPLACE_SEARCH_PATH = "/api/v1/autos/vehicles/search";

export type DealerInventoryRow = {
  id: string;
  dealer_id: string;
  make: string | null;
  model: string | null;
  year: number | null;
  status: string | null;
  vin: string | null;
  condition: string | null;
  price_rd: number | null;
  price_usd: number | null;
};

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

function readFiniteNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

export function dealerInventoryListUrl(dealerId: string): string {
  return `/api/v1/autos/dealers/${encodeURIComponent(dealerId)}/vehicles`;
}

export function parseDealerInventoryRow(value: unknown, dealerId: string): DealerInventoryRow | null {
  const rec = asRecord(value);
  if (!rec) return null;
  const id = readTrimmed(rec.id);
  const rowDealer = readTrimmed(rec.dealer_id);
  if (!id || !rowDealer || rowDealer !== dealerId) return null;
  return {
    id,
    dealer_id: rowDealer,
    make: readTrimmed(rec.make),
    model: readTrimmed(rec.model),
    year: readFiniteNumber(rec.year),
    status: readTrimmed(rec.status),
    vin: readTrimmed(rec.vin),
    condition: readTrimmed(rec.condition),
    price_rd: readFiniteNumber(rec.price_rd),
    price_usd: readFiniteNumber(rec.price_usd),
  };
}

export async function fetchDealerInventory(dealerId: string): Promise<DealerInventoryRow[]> {
  const path = dealerInventoryListUrl(dealerId);
  const response = await apiFetch(path, { headers: { Accept: "application/json" } });
  let body: unknown = null;
  try {
    body = await response.json();
  } catch {
    body = null;
  }
  if (!response.ok) {
    throw accessApiErrorFromHttp(response.status, body, path);
  }
  const root = asRecord(body);
  const list = Array.isArray(root?.vehicles) ? root.vehicles : [];
  const rows: DealerInventoryRow[] = [];
  for (const item of list) {
    const row = parseDealerInventoryRow(item, dealerId);
    if (row) rows.push(row);
  }
  return rows;
}
