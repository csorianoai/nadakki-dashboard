export function isNautaSupervisor(
  activeRole: { core_name: string; role_key: string } | null,
  allRoles: { core_name: string; role_key: string }[],
): boolean {
  const roles = [activeRole, ...allRoles].filter(Boolean) as { core_name: string; role_key: string }[];
  return roles.some(
    (r) =>
      r.role_key === "platform_superadmin" ||
      r.role_key === "tenant_admin" ||
      (r.core_name === "nauta" && (r.role_key === "supervisor" || r.role_key === "nauta_supervisor")),
  );
}

export function runRequiresApproval(status: string): boolean {
  return status === "pending_approval" || status === "awaiting_human_review";
}
