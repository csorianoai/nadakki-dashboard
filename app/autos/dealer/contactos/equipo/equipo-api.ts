/**
 * Cliente HTTP del equipo del concesionario (EQUIPO-DEALER). El tenant sale SOLO del token (sin X-Tenant-ID) y el
 * dealer lo resuelve el servidor (el unico del usuario). Sin DELETE: desactivar no borra.
 *
 * La clave temporal que devuelve una invitacion se muestra UNA vez en pantalla y no se guarda en ningun lado.
 */
import { AccessApiError, accessApiErrorFromHttp } from "@/lib/access/client";
import { apiFetch } from "@/lib/api/fetch-client";

const BASE = "/api/v1/autos/team";

export type Miembro = {
  user_id: string;
  email: string;
  is_active: boolean;
  autos_role: string;
  is_admin: boolean;
  is_self: boolean;
};

export type ResultadoInvitacion = {
  status: "created" | "already_member" | "added_to_dealer" | "reactivated";
  user_id: string;
  email: string;
  dealer_id: string;
  is_active: boolean;
  must_change_password: boolean;
  temporary_password: string | null;
};

async function llamar(path: string, init: RequestInit = {}): Promise<unknown> {
  const headers: Record<string, string> = { Accept: "application/json" };
  if (init.body) headers["Content-Type"] = "application/json";
  const response = await apiFetch(path, { ...init, headers, cache: "no-store" });
  let body: unknown = null;
  try {
    body = await response.json();
  } catch {
    body = null;
  }
  if (!response.ok) throw accessApiErrorFromHttp(response.status, body, path);
  return body;
}

export async function listarEquipo(): Promise<Miembro[]> {
  const items = ((await llamar(`${BASE}/members`)) as { items?: unknown } | null)?.items;
  return Array.isArray(items) ? (items as Miembro[]) : [];
}

export const invitarVendedor = (email: string) =>
  llamar(`${BASE}/invitations`, { method: "POST", body: JSON.stringify({ email: email.trim() }) }) as Promise<ResultadoInvitacion>;

export const desactivarMiembro = (userId: string) =>
  llamar(`${BASE}/${encodeURIComponent(userId)}/deactivate`, { method: "POST" }) as Promise<{ status: string }>;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validarEmail(email: string): string | null {
  const e = email.trim();
  if (!e) return "Escribí el correo del vendedor.";
  return EMAIL_RE.test(e) ? null : "Ese correo no parece válido.";
}

export const NOMBRE_ROL: Record<string, string> = {
  dealer_vendedor: "Vendedor",
  dealer_gerente: "Gerente",
  dealer_contador: "Contador",
  ninguno: "Sin rol",
};

const POR_MOTIVO: Record<string, string> = {
  TENANT_ADMIN_REQUIRED: "Solo el dueño o un administrador del concesionario puede gestionar el equipo.",
  EMAIL_IN_OTHER_TENANT: "Ese correo ya está registrado en otra empresa. Usá otro correo.",
  CANNOT_DEACTIVATE_SELF: "No podés desactivar tu propio usuario.",
  TARGET_IS_ADMIN: "No se puede desactivar a un administrador del concesionario.",
  NOT_FOUND: "Esa persona ya no está en el equipo. Recargá la página.",
  DEALER_ID_REQUIRED: "Tu usuario está en más de un concesionario; pedile a soporte que lo revise.",
  ROLE_TEMPLATE_MISSING: "Falta configurar el rol de vendedor. Avisale a soporte de Nadakki.",
};

/** El texto del servidor (si viene en castellano, campo `error`) manda; la tabla cubre su ausencia. */
export function mensajeError(error: unknown): string {
  if (!(error instanceof AccessApiError)) return "No hubo respuesta del servidor. Probá de nuevo.";
  const d = error.detail && typeof error.detail === "object" && !Array.isArray(error.detail)
    ? (error.detail as Record<string, unknown>) : {};
  const code = error.reason_code ?? (typeof d.reason_code === "string" ? d.reason_code : null);
  if (typeof d.error === "string") return d.error;
  if (code && POR_MOTIVO[code]) return POR_MOTIVO[code];
  if (error.status === 422) return "Revisá el correo: no es válido.";
  if (error.status === 401) return "Tu sesión venció. Volvé a entrar.";
  return `No se pudo completar la operación (${code ?? `HTTP ${error.status}`}).`;
}
