import { DMS02R_AUTHENTICATED_GET_PATHS } from "@/lib/dealer/dms02r-http";

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

/** Authenticated dealer ficha GET — unpublished on production OpenAPI. */
export const DEALER_VEHICLE_STATUS_GET_PATH = DMS02R_AUTHENTICATED_GET_PATHS.dealerVehicle;
