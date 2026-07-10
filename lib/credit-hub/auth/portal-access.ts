import type { CHActorRole } from "../api/client";
import type { CHAction } from "../utils/permissions";
import { canPerform } from "../utils/permissions";

/** Map JWT role_key → Credit Hub actor for permission matrix. */
export function resolveCHActorRole(roleKey: string | null | undefined): CHActorRole {
  const k = (roleKey ?? "").trim().toLowerCase();
  if (!k) return "customer";
  if (k === "platform_superadmin" || k === "tenant_admin" || k === "admin" || k === "sic_admin") return "admin";
  if (k === "bank_analyst") return "bank_analyst";
  if (k === "bank_admin") return "bank_admin";
  if (k === "credit_admin") return "dealer";
  if (k.includes("compliance")) return "compliance_officer";
  if (k.includes("dealer")) return "dealer";
  if (k.includes("bank")) return "bank_analyst";
  return "customer";
}

export type CreditHubPortal = "dealer" | "bank";

const DEALER_PORTAL_ROLES = new Set([
  "credit_admin",
  "dealer",
  "tenant_admin",
  "platform_superadmin",
  "admin",
]);

const BANK_PORTAL_ROLES = new Set([
  "bank_analyst",
  "bank_admin",
  "compliance_officer",
  "credit_admin",
  "tenant_admin",
  "platform_superadmin",
  "admin",
]);

export function roleKeyAllowsPortal(roleKey: string | null | undefined, portal: CreditHubPortal): boolean {
  const k = (roleKey ?? "").trim().toLowerCase();
  if (!k) return false;
  const allowed = portal === "dealer" ? DEALER_PORTAL_ROLES : BANK_PORTAL_ROLES;
  return allowed.has(k);
}

/** Roles allowed for /credit-hub/admin (Network OS). Most restrictive network operators only. */
const ADMIN_NETWORK_ROLES = new Set(["platform_superadmin", "tenant_admin"]);

export function roleKeyAllowsAdminNetwork(roleKey: string | null | undefined): boolean {
  const k = (roleKey ?? "").trim().toLowerCase();
  if (!k) return false;
  return ADMIN_NETWORK_ROLES.has(k);
}

export function actorCan(actor: CHActorRole, action: CHAction): boolean {
  return canPerform(actor, action);
}
