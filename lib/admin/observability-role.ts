/**
 * Maps dashboard auth roles to backend observability headers (EP-T3-5).
 * BANK_ANALYST = read-only, tenant-scoped; TENANT_ADMIN / SYSTEM_ADMIN = admin views.
 */
export type ObservabilityXRole = "TENANT_ADMIN" | "SYSTEM_ADMIN" | "BANK_ANALYST";

export function resolveObservabilityXRole(authRole?: string | null): ObservabilityXRole {
  const env =
    typeof process !== "undefined" && process.env.NEXT_PUBLIC_OBSERVABILITY_X_ROLE
      ? String(process.env.NEXT_PUBLIC_OBSERVABILITY_X_ROLE).trim()
      : "";
  if (env === "SYSTEM_ADMIN" || env === "TENANT_ADMIN" || env === "BANK_ANALYST") {
    return env;
  }

  const r = (authRole ?? "").trim().toLowerCase();
  if (
    r.includes("system_admin") ||
    r === "nadakki_admin" ||
    r === "superadmin" ||
    r === "platform"
  ) {
    return "SYSTEM_ADMIN";
  }
  if (r.includes("bank") || r.includes("analyst")) {
    return "BANK_ANALYST";
  }
  if (r === "owner" || r === "admin" || r === "editor") {
    return "TENANT_ADMIN";
  }
  return "BANK_ANALYST";
}
