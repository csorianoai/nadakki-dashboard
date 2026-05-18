import type { StipulationsApiRole } from "@/lib/api/stipulations-types";

/**
 * EP-T4-4: BANK_ANALYST read-only; TENANT_ADMIN may verify/reject.
 * Maps dashboard `active_role` storage (`nadakki_role`) to credit API headers.
 */
export function resolveStipulationsApiRoleFromStorage(): StipulationsApiRole {
  if (typeof window === "undefined") return "BANK_ANALYST";
  const raw = (localStorage.getItem("nadakki_role") ?? "").trim().toLowerCase();
  if (
    raw === "admin" ||
    raw === "owner" ||
    raw === "tenant_admin" ||
    raw.includes("tenant_admin") ||
    raw === "system_admin"
  ) {
    return "TENANT_ADMIN";
  }
  return "BANK_ANALYST";
}

export function canMutateStipulations(role: StipulationsApiRole): boolean {
  return role === "TENANT_ADMIN";
}
