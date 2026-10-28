import { apiFetch } from "@/lib/api/fetch-client";
import { tokenStorage } from "@/lib/auth/token-storage";
import { ACCESS_PATH } from "./config";

/** ok: 200. sin-acceso: el backend lo niega (401, 403, 404). error: otro estado o fallo de red. */
export type AccessStatus = "ok" | "sin-acceso" | "error";

const DENIED = new Set([401, 403, 404]);

export type AccessInfo = { status: AccessStatus; roles: readonly string[]; demo: boolean };

/**
 * Roles y marca `demo` legibles del cuerpo de /acceso. Sin cuerpo legible, roles vacíos y demo=false (fail-closed):
 * nunca se deduce un rol ni un tenant DEMO. `demo` solo es true si el cuerpo trae el booleano true.
 */
async function readBody(res: Response): Promise<{ roles: readonly string[]; demo: boolean }> {
  try {
    const body = (await res.json()) as { roles?: unknown; demo?: unknown };
    return {
      roles: Array.isArray(body?.roles) ? body.roles.filter((r): r is string => typeof r === "string") : [],
      demo: body?.demo === true,
    };
  } catch {
    return { roles: [], demo: false };
  }
}

async function pedirAcceso(): Promise<AccessInfo> {
  try {
    const res = await apiFetch(ACCESS_PATH, { method: "GET", cache: "no-store" });
    if (res.status === 200) return { status: "ok", ...(await readBody(res)) };
    return { status: DENIED.has(res.status) ? "sin-acceso" : "error", roles: [], demo: false };
  } catch {
    return { status: "error", roles: [], demo: false };
  }
}

/** Vigencia de una respuesta compartida. Un cambio de roles en el backend tarda como mucho esto en verse. */
const VIGENCIA_MS = 30_000;
let compartida: { token: string; desde: number; respuesta: Promise<AccessInfo> } | null = null;

/**
 * Estado y roles de /acceso. La identidad sale del token: el cliente no envía nada más.
 * Menú, armazón y panel preguntan a la vez en cada carga (RENDIMIENTO-CARGA: de 3 a 7 peticiones). Con sesión se
 * comparte una sola petición por token durante VIGENCIA_MS: un token nuevo (refresh, otro usuario) pregunta de nuevo.
 * Un error no se comparte una vez resuelto, y sin token cada llamada pregunta por su cuenta.
 */
export async function fetchPanelAccessInfo(): Promise<AccessInfo> {
  const token = tokenStorage.getAccessToken();
  if (!token) return pedirAcceso();
  const ahora = Date.now();
  if (compartida && compartida.token === token && ahora - compartida.desde < VIGENCIA_MS) return compartida.respuesta;
  const respuesta = pedirAcceso();
  const entrada = { token, desde: ahora, respuesta };
  compartida = entrada;
  void respuesta.then((r) => { if (r.status === "error" && compartida === entrada) compartida = null; });
  return respuesta;
}

/** Fail-closed: solo un 200 abre el panel. */
export async function fetchPanelAccessStatus(): Promise<AccessStatus> {
  return (await fetchPanelAccessInfo()).status;
}

export async function fetchPanelAccess(): Promise<boolean> {
  return (await fetchPanelAccessStatus()) === "ok";
}
