/** Autos Portal cart + compare — client-side session types. */

export type CartVehicle = {
  vehicle_id: string;
  vehicle_name: string;
  vehicle_price: number;
  vehicle_image: string;
  added_at: number;
  tenant_id: string;
  year?: number;
  km?: number;
  fuel?: string;
  trans?: string;
  type?: string;
  features?: string;
};

export type CartState = {
  version: 1;
  vehicles: CartVehicle[];
  compare_ids: string[];
  compare_enabled: boolean;
  last_updated: number;
};

export type CartAuditEntry = {
  operation: string;
  vehicle_id?: string;
  tenant_id: string;
  timestamp: number;
  result: "ok" | "error";
  detail?: string;
};

export type VehicleCartInput = {
  vehicle_id: string;
  vehicle_name: string;
  vehicle_price: number;
  vehicle_image: string;
  tenant_id: string;
  year?: number;
  km?: number;
  fuel?: string;
  trans?: string;
  type?: string;
  features?: string;
};

export const CART_STORAGE_VERSION = 1 as const;
export const MAX_COMPARE_VEHICLES = 3;
export const SHARE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;
export const SHARE_URL_MAX_CHARS = 2000;
