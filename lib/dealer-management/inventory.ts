import { accessApiErrorFromHttp } from "@/lib/access/client";
import { apiFetch } from "@/lib/api/fetch-client";

export type DealerInventoryVehicle = {
  id: string;
  make: string | null;
  model: string | null;
  year: string | null;
  status: string | null;
  /** P2 (#1545/#1564): la lista privada ya los devuelve; sirven para buscar y ordenar. */
  plate?: string | null;
  stock_number?: string | null;
  vin?: string | null;
  price_amount?: number | null;
};

function amount(value: unknown): number | null {
  const n = typeof value === "string" ? Number(value) : value;
  return typeof n === "number" && Number.isFinite(n) ? n : null;
}

function record(value: unknown): Record<string, unknown> | null { return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : null; }
function text(value: unknown): string | null { if (typeof value === "string") return value.trim() || null; if (typeof value === "number" && Number.isFinite(value)) return String(value); return null; }
function rows(body: unknown): unknown[] { if (Array.isArray(body)) return body; const rec = record(body); return rec && Array.isArray(rec.vehicles) ? rec.vehicles : []; }

export async function fetchDealerInventory(dealerId: string): Promise<DealerInventoryVehicle[]> {
  const path = `/api/v1/autos/dealers/${encodeURIComponent(dealerId)}/vehicles`;
  const response = await apiFetch(path, { headers: { Accept: "application/json" } });
  let body: unknown = null;
  try { body = await response.json(); } catch { body = null; }
  if (!response.ok) throw accessApiErrorFromHttp(response.status, body, path);
  return rows(body).map((value): DealerInventoryVehicle | null => {
    const rec = record(value);
    const id = rec ? text(rec.id) : null;
    if (!rec || !id) return null;
    return {
      id,
      make: text(rec.make) ?? text(rec.marca),
      model: text(rec.model) ?? text(rec.modelo),
      year: text(rec.year) ?? text(rec.ano),
      status: text(rec.status),
      plate: text(rec.plate),
      stock_number: text(rec.stock_number),
      vin: text(rec.vin),
      price_amount: amount(rec.price_amount),
    };
  }).filter((vehicle): vehicle is DealerInventoryVehicle => vehicle !== null);
}
