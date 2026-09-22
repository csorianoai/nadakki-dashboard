import { accessApiErrorFromHttp } from "@/lib/access/client";
import { apiFetch } from "@/lib/api/fetch-client";

export type DealerVehicleStatusRow = {
  id: string;
  make: string | null;
  model: string | null;
  year: number | null;
  status: string | null;
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

export function parseDealerVehicleStatus(value: unknown): DealerVehicleStatusRow | null {
  const rec = asRecord(value);
  if (!rec) return null;
  const id = readTrimmed(rec.id);
  if (!id) return null;
  return {
    id,
    make: readTrimmed(rec.make),
    model: readTrimmed(rec.model),
    year: readFiniteNumber(rec.year),
    status: readTrimmed(rec.status),
  };
}

export async function fetchDealerVehicleStatus(vehicleId: string): Promise<DealerVehicleStatusRow> {
  const path = `/api/v1/autos/vehicles/${encodeURIComponent(vehicleId)}`;
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
  const row = parseDealerVehicleStatus(body);
  if (!row) {
    throw accessApiErrorFromHttp(422, { reason_code: "VALIDATION_ERROR" }, path);
  }
  return row;
}
