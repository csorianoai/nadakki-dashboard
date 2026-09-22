import { accessApiErrorFromHttp } from "@/lib/access/client";
import { apiFetch } from "@/lib/api/fetch-client";

export const VEHICLE_ACQUISITION_PATH = "/api/v1/autos/vehicles/{vehicle_id}/acquisition";
export const VEHICLE_COSTS_PATH = "/api/v1/autos/vehicles/{vehicle_id}/costs";
export const VEHICLE_SALE_PATH = "/api/v1/autos/vehicles/{vehicle_id}/sale";

export type AcquisitionBody = {
  acquisition_mode_code: string;
  acquired_at: string;
  country_code: string;
  supplier_reference: string | null;
};

export type CostBody = {
  cost_type: string;
  amount: string;
  currency: string;
  incurred_at: string;
  reverses_entry_id: string | null;
};

export type SaleBody = {
  sale_price_amount: string;
  currency: string;
  sold_at: string;
};

function vehicleWriteUrl(vehicleId: string, suffix: "acquisition" | "costs" | "sale"): string {
  return `/api/v1/autos/vehicles/${encodeURIComponent(vehicleId)}/${suffix}`;
}

async function accessPost(path: string, tenantId: string, body: unknown): Promise<unknown> {
  const response = await apiFetch(path, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      "X-Tenant-ID": tenantId,
    },
    body: JSON.stringify(body),
  });
  let parsed: unknown = null;
  try {
    parsed = await response.json();
  } catch {
    parsed = null;
  }
  if (!response.ok) throw accessApiErrorFromHttp(response.status, parsed, path);
  return parsed;
}

export function acquisitionPayload(form: AcquisitionBody): Record<string, unknown> {
  const payload: Record<string, unknown> = {
    acquisition_mode_code: form.acquisition_mode_code,
    acquired_at: form.acquired_at,
    country_code: form.country_code,
  };
  if (form.supplier_reference) payload.supplier_reference = form.supplier_reference;
  return payload;
}

export function costPayload(form: CostBody): Record<string, unknown> {
  const payload: Record<string, unknown> = {
    cost_type: form.cost_type,
    amount: form.amount,
    currency: form.currency,
    incurred_at: form.incurred_at,
  };
  if (form.reverses_entry_id) payload.reverses_entry_id = form.reverses_entry_id;
  return payload;
}

export function salePayload(form: SaleBody): Record<string, unknown> {
  return {
    sale_price_amount: form.sale_price_amount,
    currency: form.currency,
    sold_at: form.sold_at,
  };
}

export async function postVehicleAcquisition(
  vehicleId: string,
  tenantId: string,
  form: AcquisitionBody,
): Promise<unknown> {
  return accessPost(vehicleWriteUrl(vehicleId, "acquisition"), tenantId, acquisitionPayload(form));
}

export async function postVehicleCost(
  vehicleId: string,
  tenantId: string,
  form: CostBody,
): Promise<unknown> {
  return accessPost(vehicleWriteUrl(vehicleId, "costs"), tenantId, costPayload(form));
}

export async function postVehicleSale(
  vehicleId: string,
  tenantId: string,
  form: SaleBody,
): Promise<unknown> {
  return accessPost(vehicleWriteUrl(vehicleId, "sale"), tenantId, salePayload(form));
}
