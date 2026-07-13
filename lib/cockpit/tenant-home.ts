import { getPostLoginRedirectPath } from "@/lib/auth/auth-context";
import type { RoleInfo } from "@/lib/api/auth-v2";

/** Same destination as post-login redirect for the user's role set. */
export function getTenantDashboardHome(roles: RoleInfo[]): string {
  return getPostLoginRedirectPath(roles);
}
