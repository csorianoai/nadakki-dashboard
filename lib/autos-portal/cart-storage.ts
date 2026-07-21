/** SessionStorage persistence for Autos cart (pure helpers — testable). */

import type { CartAuditEntry, CartState, CartVehicle, VehicleCartInput } from "./cart-types";
import { CART_STORAGE_VERSION, MAX_COMPARE_VEHICLES } from "./cart-types";

export function cartStorageKey(tenantId: string): string {
  return `autos_cart_${tenantId}`;
}

export function cartAuditKey(tenantId: string): string {
  return `autos_cart_audit_${tenantId}`;
}

export function emptyCartState(): CartState {
  const now = Date.now();
  return {
    version: CART_STORAGE_VERSION,
    vehicles: [],
    compare_ids: [],
    compare_enabled: false,
    last_updated: now,
  };
}

export function parseCartState(raw: string | null): CartState {
  if (!raw) return emptyCartState();
  try {
    const parsed = JSON.parse(raw) as Partial<CartState>;
    if (parsed.version !== CART_STORAGE_VERSION || !Array.isArray(parsed.vehicles)) {
      return emptyCartState();
    }
    return {
      version: CART_STORAGE_VERSION,
      vehicles: parsed.vehicles.filter(isCartVehicle),
      compare_ids: Array.isArray(parsed.compare_ids)
        ? parsed.compare_ids.filter((id): id is string => typeof id === "string")
        : [],
      compare_enabled: Boolean(parsed.compare_enabled),
      last_updated: typeof parsed.last_updated === "number" ? parsed.last_updated : Date.now(),
    };
  } catch {
    return emptyCartState();
  }
}

function isCartVehicle(v: unknown): v is CartVehicle {
  if (!v || typeof v !== "object") return false;
  const o = v as Record<string, unknown>;
  return (
    typeof o.vehicle_id === "string" &&
    typeof o.vehicle_name === "string" &&
    typeof o.vehicle_price === "number" &&
    typeof o.vehicle_image === "string" &&
    typeof o.added_at === "number" &&
    typeof o.tenant_id === "string"
  );
}

export function addVehicleToCart(state: CartState, input: VehicleCartInput, now = Date.now()): CartState {
  if (input.tenant_id !== state.vehicles[0]?.tenant_id && state.vehicles.length > 0) {
    const mismatch = state.vehicles.some((v) => v.tenant_id !== input.tenant_id);
    if (mismatch) {
      return state;
    }
  }

  const existingIdx = state.vehicles.findIndex((v) => v.vehicle_id === input.vehicle_id);
  const vehicle: CartVehicle = {
    vehicle_id: input.vehicle_id,
    vehicle_name: input.vehicle_name,
    vehicle_price: input.vehicle_price,
    vehicle_image: input.vehicle_image,
    added_at: now,
    tenant_id: input.tenant_id,
    year: input.year,
    km: input.km,
    fuel: input.fuel,
    trans: input.trans,
    type: input.type,
    features: input.features,
  };

  const vehicles =
    existingIdx >= 0
      ? state.vehicles.map((v, i) => (i === existingIdx ? vehicle : v))
      : [...state.vehicles, vehicle];

  return { ...state, vehicles, last_updated: now };
}

export function removeVehicleFromCart(state: CartState, vehicleId: string, now = Date.now()): CartState {
  return {
    ...state,
    vehicles: state.vehicles.filter((v) => v.vehicle_id !== vehicleId),
    compare_ids: state.compare_ids.filter((id) => id !== vehicleId),
    last_updated: now,
  };
}

export function toggleCompareEnabled(state: CartState, now = Date.now()): CartState {
  return {
    ...state,
    compare_enabled: !state.compare_enabled,
    last_updated: now,
  };
}

export function addToCompare(state: CartState, vehicleId: string, now = Date.now()): CartState {
  if (!state.vehicles.some((v) => v.vehicle_id === vehicleId)) return state;
  if (state.compare_ids.includes(vehicleId)) return state;
  if (state.compare_ids.length >= MAX_COMPARE_VEHICLES) return state;
  return {
    ...state,
    compare_ids: [...state.compare_ids, vehicleId],
    compare_enabled: true,
    last_updated: now,
  };
}

export function removeFromCompare(state: CartState, vehicleId: string, now = Date.now()): CartState {
  return {
    ...state,
    compare_ids: state.compare_ids.filter((id) => id !== vehicleId),
    last_updated: now,
  };
}

export function clearCompare(state: CartState, now = Date.now()): CartState {
  return {
    ...state,
    compare_ids: [],
    compare_enabled: false,
    last_updated: now,
  };
}

export function clearCart(state: CartState, now = Date.now()): CartState {
  return emptyCartState();
}

export function cartCount(state: CartState): number {
  return state.vehicles.length;
}

export function compareCount(state: CartState): number {
  return state.compare_ids.length;
}

export function getCompareVehicles(state: CartState): CartVehicle[] {
  return state.vehicles.filter((v) => state.compare_ids.includes(v.vehicle_id));
}

export function appendAuditEntry(
  entries: CartAuditEntry[],
  entry: CartAuditEntry,
  max = 50,
): CartAuditEntry[] {
  return [entry, ...entries].slice(0, max);
}

export function readAuditLog(storage: Storage, tenantId: string): CartAuditEntry[] {
  try {
    const raw = storage.getItem(cartAuditKey(tenantId));
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? (parsed as CartAuditEntry[]) : [];
  } catch {
    return [];
  }
}

export function writeAuditLog(storage: Storage, tenantId: string, entries: CartAuditEntry[]): void {
  try {
    storage.setItem(cartAuditKey(tenantId), JSON.stringify(entries));
  } catch {
    /* quota — ignore */
  }
}
