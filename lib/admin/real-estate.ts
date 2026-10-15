import { apiFetch } from "@/lib/api/fetch-client";
import { ACCESS_PATH } from "@/lib/realtor/config";
import { BASE_ALTA } from "@/lib/realtor/alta";

type Fetcher = (ruta: string, init?: RequestInit) => Promise<Response>;

export const RUTA_ALTA = "/realtor/alta";
export const RUTA_AGENTE_WEB = "/realtor/agente-web";
export const RUTA_PERFIL = `${BASE_ALTA}/tenant/profile`;

/** Roles que administran Real Estate. Lo que no esta aqui no concede nada (fail-closed). */
const ROLES_ADMIN = new Set(["admin", "administrador", "tenant_admin", "owner", "platform_superadmin"]);

export type Configuracion = {
  roles: string[];
  /** null = el backend no devolvio datos (404/503/error): se rotula "Sin datos todavia". */
  jurisdicciones: string[] | null;
};

export type Resultado = { acceso: false } | ({ acceso: true } & Configuracion);

/** Acepta `roles: ["admin"]` o `roles: [{ role_key: "admin" }]`; cualquier otra forma es "sin roles". */
export function leerRoles(cuerpo: unknown): string[] {
  const lista = (cuerpo as { roles?: unknown } | null)?.roles;
  if (!Array.isArray(lista)) return [];
  return lista
    .map((r) => (typeof r === "string" ? r : (r as { role_key?: unknown } | null)?.role_key))
    .filter((r): r is string => typeof r === "string" && r.length > 0);
}

export const esRolAdmin = (rol: string) => ROLES_ADMIN.has(rol.trim().toLowerCase());

async function json(res: Response): Promise<unknown> {
  try {
    return await res.json();
  } catch {
    return null;
  }
}

/**
 * Solo con GET /acceso en 200 y un rol de administracion se devuelve configuracion.
 * Ningun tenant sale del cliente: lo resuelve el backend desde el token.
 * Lectura unicamente: no existe endpoint de escritura de zonas ni de permisos.
 */
export async function cargarConfiguracion(enviar: Fetcher = apiFetch): Promise<Resultado> {
  let roles: string[];
  try {
    const res = await enviar(ACCESS_PATH, { method: "GET", cache: "no-store" });
    if (res.status !== 200) return { acceso: false };
    roles = leerRoles(await json(res));
  } catch {
    return { acceso: false };
  }
  if (!roles.some(esRolAdmin)) return { acceso: false };

  let jurisdicciones: string[] | null = null;
  try {
    const res = await enviar(RUTA_PERFIL, { method: "GET", cache: "no-store" });
    if (res.ok) {
      const codigo = (await json(res) as { jurisdiction_code?: unknown } | null)?.jurisdiction_code;
      if (typeof codigo === "string" && codigo.trim()) jurisdicciones = [codigo.trim()];
    }
  } catch {
    jurisdicciones = null;
  }
  return { acceso: true, roles, jurisdicciones };
}

/** Dato de muestra: solo se pinta con DEMO permitido y siempre rotulado. */
export const JURISDICCIONES_DEMO = ["US-FL", "US-TX"];
export const ROTULO_DEMO = "DEMO · datos sintéticos";
