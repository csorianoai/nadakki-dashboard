import { accessApiErrorFromHttp } from "@/lib/access/client";
import { apiFetch } from "@/lib/api/fetch-client";

export const VEHICLE_MARGIN_PATH = "/api/v1/autos/vehicles/{vehicle_id}/margin";
export const VEHICLE_DAYS_PATH = "/api/v1/autos/vehicles/{vehicle_id}/days";

export type VehicleMarginRow = {
  currency: string;
  sale_price_amount: string;
  total_cost: string;
  margin: string;
};

export type VehicleDaysRow = {
  acquired_at: string | null;
  days_in_inventory: number | null;
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
  if (typeof value === "string") return readTrimmed(value);
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  return null;
}

function readDays(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

export function vehicleMarginUrl(vehicleId: string): string {
  return `/api/v1/autos/vehicles/${encodeURIComponent(vehicleId)}/margin`;
}

export function vehicleDaysUrl(vehicleId: string): string {
  return `/api/v1/autos/vehicles/${encodeURIComponent(vehicleId)}/days`;
}

export function parseVehicleMarginRow(value: unknown): VehicleMarginRow | null {
  const rec = asRecord(value);
  if (!rec) return null;
  const currency = readTrimmed(rec.currency);
  const sale_price_amount = readAmount(rec.sale_price_amount);
  const total_cost = readAmount(rec.total_cost);
  const margin = readAmount(rec.margin);
  if (!currency || sale_price_amount == null || total_cost == null || margin == null) return null;
  return { currency, sale_price_amount, total_cost, margin };
}

export function parseVehicleDays(value: unknown): VehicleDaysRow | null {
  const rec = asRecord(value);
  if (!rec) return null;
  return {
    acquired_at: readTrimmed(rec.acquired_at),
    days_in_inventory: readDays(rec.days_in_inventory),
  };
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

export async function fetchVehicleMargins(
  vehicleId: string,
  tenantId: string,
): Promise<VehicleMarginRow[]> {
  const body = await accessGet(vehicleMarginUrl(vehicleId), tenantId);
  const list = Array.isArray(body) ? body : [];
  const rows: VehicleMarginRow[] = [];
  for (const item of list) {
    const row = parseVehicleMarginRow(item);
    if (row) rows.push(row);
  }
  return rows;
}

export async function fetchVehicleDays(
  vehicleId: string,
  tenantId: string,
): Promise<VehicleDaysRow> {
  const body = await accessGet(vehicleDaysUrl(vehicleId), tenantId);
  const row = parseVehicleDays(body);
  if (!row) throw accessApiErrorFromHttp(422, { reason_code: "VALIDATION_ERROR" }, vehicleDaysUrl(vehicleId));
  return row;
}
