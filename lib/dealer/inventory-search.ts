import { accessApiErrorFromHttp } from "@/lib/access/client";
import { apiFetch } from "@/lib/api/fetch-client";

export const DEALER_INVENTORY_SEARCH_PATH = "/api/v1/autos/vehicles/search";

export type DealerInventoryRow = {
  id: string;
  make: string | null;
  model: string | null;
  year: number | null;
  status: string | null;
  price_rd: number | null;
  mileage_km: number | null;
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

export function parseDealerInventoryRow(
  value: unknown,
  tenantId: string,
  dealerId: string,
): DealerInventoryRow | null {
  const rec = asRecord(value);
  if (!rec) return null;
  const id = readTrimmed(rec.id);
  if (!id) return null;
  if (readTrimmed(rec.tenant_id) !== tenantId) return null;
  if (readTrimmed(rec.dealer_id) !== dealerId) return null;
  return {
    id,
    make: readTrimmed(rec.make),
    model: readTrimmed(rec.model),
    year: readFiniteNumber(rec.year),
    status: readTrimmed(rec.status),
    price_rd: readFiniteNumber(rec.price_rd),
    mileage_km: readFiniteNumber(rec.mileage_km),
  };
}

export async function fetchDealerInventory(
  tenantId: string,
  dealerId: string,
): Promise<DealerInventoryRow[]> {
  const response = await apiFetch(DEALER_INVENTORY_SEARCH_PATH, {
    method: "POST",
    headers: { Accept: "application/json", "Content-Type": "application/json" },
    body: JSON.stringify({ page: 1, page_size: 50 }),
  });
  let body: unknown = null;
  try {
    body = await response.json();
  } catch {
    body = null;
  }
  if (!response.ok) {
    throw accessApiErrorFromHttp(response.status, body, DEALER_INVENTORY_SEARCH_PATH);
  }
  const root = asRecord(body);
  const list = Array.isArray(root?.vehicles) ? root.vehicles : [];
  const rows: DealerInventoryRow[] = [];
  for (const item of list) {
    const row = parseDealerInventoryRow(item, tenantId, dealerId);
    if (row) rows.push(row);
  }
  return rows;
}
