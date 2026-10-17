import { apiFetch } from "@/lib/api/fetch-client";

export type Enviar = (ruta: string, init?: RequestInit) => Promise<Response>;

/** Contrato medido en openapi.json: UserCreateBody / UserUpdateBody de /api/v1/cockpit/users. */
export const RUTA_USUARIOS = "/api/v1/cockpit/users";

export type Usuario = { id: string; name: string; email: string; role: string; activo: boolean };
export type Rol = { role_key: string; display_name: string };

async function cuerpo(res: Response): Promise<Record<string, unknown> | null> {
  try {
    return (await res.json()) as Record<string, unknown>;
  } catch {
    return null;
  }
}

/** Mensaje legible de un fallo: el `detail` del backend si es texto; si no, el codigo HTTP. */
async function fallo(res: Response, que: string): Promise<Error> {
  const d = (await cuerpo(res))?.detail;
  return new Error(typeof d === "string" && d ? d : `${que} (HTTP ${res.status}).`);
}

export function leerUsuario(x: unknown): Usuario | null {
  const u = (x ?? {}) as Record<string, unknown>;
  const id = String(u.id ?? "").trim();
  if (!id) return null;
  const email = String(u.email ?? "");
  const activo = typeof u.is_active === "boolean" ? u.is_active : String(u.status ?? "active") !== "inactive";
  return { id, email, name: String(u.name ?? "") || email, role: String(u.role ?? u.role_key ?? ""), activo };
}

export async function listarUsuarios(tenantId: string, enviar: Enviar = apiFetch): Promise<Usuario[]> {
  const res = await enviar(`${RUTA_USUARIOS}?tenant_id=${encodeURIComponent(tenantId)}&limit=200`, { method: "GET" });
  if (!res.ok) throw await fallo(res, "No se pudieron cargar los usuarios");
  const lista = (await cuerpo(res))?.users;
  if (!Array.isArray(lista)) throw new Error("La respuesta del API no incluye una lista de usuarios válida.");
  return lista.map(leerUsuario).filter((u): u is Usuario => u !== null);
}

export async function listarRoles(enviar: Enviar = apiFetch): Promise<Rol[]> {
  const res = await enviar(`${RUTA_USUARIOS}/roles`, { method: "GET" });
  if (!res.ok) throw await fallo(res, "No se pudieron cargar los roles");
  const lista = (await cuerpo(res))?.roles;
  return Array.isArray(lista)
    ? lista.filter((r): r is Rol => typeof (r as Rol)?.role_key === "string")
    : [];
}

async function enviarJson(enviar: Enviar, ruta: string, metodo: string, datos: unknown, que: string) {
  const res = await enviar(ruta, { method: metodo, body: JSON.stringify(datos) });
  if (!res.ok) throw await fallo(res, que);
}

/** El tenant sale de la sesion (token), nunca de un campo libre. */
export const altaUsuario = (enviar: Enviar, tenantId: string, email: string, role: string) =>
  enviarJson(enviar, RUTA_USUARIOS, "POST", { tenant_id: tenantId, email, role, is_active: true }, "No se pudo dar de alta");

export const cambiarRol = (enviar: Enviar, id: string, role: string) =>
  enviarJson(enviar, `${RUTA_USUARIOS}/${encodeURIComponent(id)}`, "PATCH", { role }, "No se pudo cambiar el rol");

export const cambiarEstado = (enviar: Enviar, id: string, activo: boolean) =>
  enviarJson(enviar, `${RUTA_USUARIOS}/${encodeURIComponent(id)}`, "PATCH", { is_active: activo }, "No se pudo cambiar el estado");
