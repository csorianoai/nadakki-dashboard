/** Session-backed admin demo queues (survives refresh, tenant-scoped). */

import type { AdminDealerRow, AdminVehicleRow, AutosFeatureFlags } from "./admin-types";
import { DEFAULT_AUTOS_FEATURE_FLAGS } from "./admin-types";

function vehiclesKey(tenantId: string): string {
  return `autos_admin_vehicles_${tenantId}`;
}

function dealersKey(tenantId: string): string {
  return `autos_admin_dealers_${tenantId}`;
}

function flagsKey(tenantId: string): string {
  return `autos_admin_flags_${tenantId}`;
}

export function loadAdminVehicles(tenantId: string, seed: AdminVehicleRow[]): AdminVehicleRow[] {
  if (typeof window === "undefined") return seed;
  try {
    const raw = sessionStorage.getItem(vehiclesKey(tenantId));
    if (!raw) {
      sessionStorage.setItem(vehiclesKey(tenantId), JSON.stringify(seed));
      return seed;
    }
    return JSON.parse(raw) as AdminVehicleRow[];
  } catch {
    return seed;
  }
}

export function saveAdminVehicles(tenantId: string, rows: AdminVehicleRow[]): void {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(vehiclesKey(tenantId), JSON.stringify(rows));
}

export function loadAdminDealers(tenantId: string, seed: AdminDealerRow[]): AdminDealerRow[] {
  if (typeof window === "undefined") return seed;
  try {
    const raw = sessionStorage.getItem(dealersKey(tenantId));
    if (!raw) {
      sessionStorage.setItem(dealersKey(tenantId), JSON.stringify(seed));
      return seed;
    }
    return JSON.parse(raw) as AdminDealerRow[];
  } catch {
    return seed;
  }
}

export function saveAdminDealers(tenantId: string, rows: AdminDealerRow[]): void {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(dealersKey(tenantId), JSON.stringify(rows));
}

export function loadAdminFlags(
  tenantId: string,
  seed: AutosFeatureFlags = DEFAULT_AUTOS_FEATURE_FLAGS,
): AutosFeatureFlags {
  if (typeof window === "undefined") return seed;
  try {
    const raw = sessionStorage.getItem(flagsKey(tenantId));
    if (!raw) {
      sessionStorage.setItem(flagsKey(tenantId), JSON.stringify(seed));
      return seed;
    }
    return { ...seed, ...(JSON.parse(raw) as AutosFeatureFlags) };
  } catch {
    return seed;
  }
}

export function saveAdminFlags(tenantId: string, flags: AutosFeatureFlags): void {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(flagsKey(tenantId), JSON.stringify(flags));
}
