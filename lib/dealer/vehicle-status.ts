import { accessApiErrorFromHttp } from "@/lib/access/client";
import { apiFetch } from "@/lib/api/fetch-client";
import { dealerVehicleGetUrl } from "@/lib/dealer/dms02r-http";

export type DealerVehicleStatusRow = {
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
  /** P2 (#1545/#1564). El importe llega como numero JSON; se guarda como texto. */
  price_amount: string | null;
  price_currency: string | null;
  display_price_amount: string | null;
  display_price_currency: string | null;
  plate: string | null;
  plate_country: string | null;
  stock_number: string | null;
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

function readAmount(value: unknown): string | null {
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  return readTrimmed(value);
}

function readFiniteNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

export function parseDealerVehicleStatus(value: unknown, dealerId: string): DealerVehicleStatusRow | null {
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
    price_amount: readAmount(rec.price_amount),
    price_currency: readTrimmed(rec.price_currency),
    display_price_amount: readAmount(rec.display_price_amount),
    display_price_currency: readTrimmed(rec.display_price_currency),
    plate: readTrimmed(rec.plate),
    plate_country: readTrimmed(rec.plate_country),
    stock_number: readTrimmed(rec.stock_number),
  };
}

export async function fetchDealerVehicleStatus(
  dealerId: string,
  vehicleId: string,
): Promise<DealerVehicleStatusRow> {
  const path = dealerVehicleGetUrl(dealerId, vehicleId);
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
  const row = parseDealerVehicleStatus(body, dealerId);
  if (!row) {
    throw accessApiErrorFromHttp(422, { reason_code: "VALIDATION_ERROR" }, path);
  }
  return row;
}
