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

/**
 * Respuesta de las dos rutas del Cockpit que emiten una clave temporal.
 *
 * MEDIDO contra el backend en `48a83ff6`: tanto
 * `POST /api/v1/cockpit/users` (`routers/cockpit_users_router.py:151-156`) como
 * `POST /api/v1/cockpit/users/{user_id}/reset-password` (`:227-231`) devuelven
 * `temp_password`. Aqui se declaraba `reset_token`, un campo que el backend NUNCA
 * envia, asi que el valor llegaba `undefined` y la clave se perdia.
 *
 * El tipo generado no sirve de contrato: los dos handlers son `dict[str, Any]`
 * sin `response_model`, asi que `types/autos-portal-api.d.ts` los describe como
 * `{[key: string]: unknown}`. Este tipo escrito a mano ES el contrato.
 */
export type TempPasswordResponse = {
  success?: boolean;
  user_id?: string;
  temp_password?: string;
  created_at?: string;
};

export async function createUser(body: {
  name: string;
  email: string;
  role_key: string;
  tenant_id: string;
  core_codes?: string[];
  password?: string;
}): Promise<TempPasswordResponse> {
  return platformFetch("/api/v1/cockpit/users", { method: "POST", body: JSON.stringify(body) });
}

export async function resetUserPassword(userId: string): Promise<TempPasswordResponse> {
  return platformFetch(`/api/v1/cockpit/users/${encodeURIComponent(userId)}/reset-password`, {
    method: "POST",
    body: "{}",
  });
}
