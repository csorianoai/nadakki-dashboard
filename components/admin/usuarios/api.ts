import { apiFetch } from "@/lib/api/fetch-client";

/** Contrato medido en routers/cockpit_users_router.py (backend main): requiere rol de plataforma. */
export type Enviar = (ruta: string, init?: RequestInit) => Promise<Response>;
export const enviarAutenticado: Enviar = (ruta, init) => apiFetch(ruta, init);

const BASE = "/api/v1/cockpit/users";

export interface Usuario {
  id: string;
  nombre: string;
  correo: string;
  rol: string;
  activo: boolean;
}

export class ErrorApi extends Error {}

function mensaje(estado: number, cuerpo: unknown): string {
  const d = (cuerpo as { detail?: unknown } | null)?.detail;
  if (estado === 403) return "Tu sesión no tiene permiso de plataforma para gestionar usuarios (HTTP 403).";
  if (typeof d === "string" && d) return `${d} (HTTP ${estado})`;
  return `El servidor rechazó la operación (HTTP ${estado}).`;
}

async function llamar(enviar: Enviar, ruta: string, init?: RequestInit): Promise<Record<string, unknown>> {
  let r: Response;
  try {
    r = await enviar(ruta, init);
  } catch {
    throw new ErrorApi("No se pudo conectar con el servidor.");
  }
  const cuerpo = await r.json().catch(() => null);
  if (!r.ok) throw new ErrorApi(mensaje(r.status, cuerpo));
  return (cuerpo ?? {}) as Record<string, unknown>;
}

export async function listarUsuarios(enviar: Enviar, tenantId: string): Promise<Usuario[]> {
  const d = await llamar(enviar, `${BASE}?tenant_id=${encodeURIComponent(tenantId)}&limit=500`);
  if (!Array.isArray(d.users)) throw new ErrorApi("La respuesta del API no incluye una lista de usuarios válida.");
  return (d.users as Record<string, unknown>[]).map((u) => ({
    id: String(u.id ?? ""),
    nombre: String(u.name ?? "") || "—",
    correo: String(u.email ?? ""),
    rol: String(u.role ?? u.role_key ?? ""),
    activo: u.is_active !== false,
  }));
}

export async function listarRoles(enviar: Enviar): Promise<string[]> {
  const d = await llamar(enviar, `${BASE}/roles`);
  const roles = Array.isArray(d.roles) ? (d.roles as Record<string, unknown>[]) : [];
  return roles.map((r) => String(r.role ?? r.role_key ?? "")).filter(Boolean);
}

export async function crearUsuario(enviar: Enviar, tenantId: string, correo: string, rol: string) {
  const d = await llamar(enviar, BASE, {
    method: "POST",
    body: JSON.stringify({ tenant_id: tenantId, email: correo, role: rol, is_active: true }),
  });
  return typeof d.temp_password === "string" ? d.temp_password : null;
}

export async function actualizarUsuario(enviar: Enviar, id: string, cambio: { role?: string; is_active?: boolean }) {
  await llamar(enviar, `${BASE}/${encodeURIComponent(id)}`, { method: "PATCH", body: JSON.stringify(cambio) });
}
