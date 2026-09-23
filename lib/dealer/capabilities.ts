import { MIGRATION_097_CAPABILITY_KEYS } from "@/lib/dealer/core-status";

function catalogKey(key: string): string {
  if (!MIGRATION_097_CAPABILITY_KEYS.has(key)) {
    throw new Error(`dealer capability is not in 097 catalog: ${key}`);
  }
  return key;
}

export const DEALER_VEHICLE_CAPABILITY = catalogKey("autos.inventory.list");
export const DEALER_REGISTER_CAPABILITY = catalogKey("autos.inventory.create");
