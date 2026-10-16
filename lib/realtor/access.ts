import { apiFetch } from "@/lib/api/fetch-client";
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

/** Una sola petición: estado y roles. La identidad sale del token: el cliente no envía nada más. */
export async function fetchPanelAccessInfo(): Promise<AccessInfo> {
  try {
    const res = await apiFetch(ACCESS_PATH, { method: "GET", cache: "no-store" });
    if (res.status === 200) return { status: "ok", ...(await readBody(res)) };
    return { status: DENIED.has(res.status) ? "sin-acceso" : "error", roles: [], demo: false };
  } catch {
    return { status: "error", roles: [], demo: false };
  }
}

/** Fail-closed: solo un 200 abre el panel. */
export async function fetchPanelAccessStatus(): Promise<AccessStatus> {
  return (await fetchPanelAccessInfo()).status;
}

export async function fetchPanelAccess(): Promise<boolean> {
  return (await fetchPanelAccessStatus()) === "ok";
}
