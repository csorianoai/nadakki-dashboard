import { platformFetch } from "@/lib/platformApi";
import type { AuthUserRecord, AuthRole } from "../types-platform";

export async function fetchUsers(tenantId?: string): Promise<AuthUserRecord[]> {
  const q = tenantId ? `?tenant_id=${encodeURIComponent(tenantId)}` : "";
  try {
    const res = await platformFetch<{ users: AuthUserRecord[] }>(`/api/v1/cockpit/users${q}`);
    return res.users ?? [];
  } catch {
    return [];
  }
}

export async function fetchRoles(): Promise<AuthRole[]> {
  try {
    const res = await platformFetch<{ roles: AuthRole[] }>("/api/v1/cockpit/users/roles");
    return res.roles ?? [];
  } catch {
    return [];
  }
}

export async function createUser(body: {
  name: string;
  email: string;
  role_key: string;
  tenant_id: string;
  core_codes?: string[];
  password?: string;
}): Promise<{ user: AuthUserRecord; reset_token?: string }> {
  return platformFetch("/api/v1/cockpit/users", { method: "POST", body: JSON.stringify(body) });
}

export async function resetUserPassword(userId: string): Promise<{ reset_token: string }> {
  return platformFetch(`/api/v1/cockpit/users/${encodeURIComponent(userId)}/reset-password`, {
    method: "POST",
    body: "{}",
  });
}
