import { apiFetch } from "@/lib/api/fetch-client";
import { ACCESS_PATH } from "./config";

/** ok: 200. sin-acceso: el backend lo niega (401, 403, 404). error: otro estado o fallo de red. */
export type AccessStatus = "ok" | "sin-acceso" | "error";

const DENIED = new Set([401, 403, 404]);

export type AccessInfo = { status: AccessStatus; roles: readonly string[] };

/** Roles legibles del cuerpo de /acceso. Sin cuerpo legible, lista vacía (fail-closed): nunca se deduce un rol. */
async function readRoles(res: Response): Promise<readonly string[]> {
  try {
    const body = (await res.json()) as { roles?: unknown };
    return Array.isArray(body?.roles) ? body.roles.filter((r): r is string => typeof r === "string") : [];
  } catch {
    return [];
  }
}

/** Una sola petición: estado y roles. La identidad sale del token: el cliente no envía nada más. */
export async function fetchPanelAccessInfo(): Promise<AccessInfo> {
  try {
    const res = await apiFetch(ACCESS_PATH, { method: "GET", cache: "no-store" });
    if (res.status === 200) return { status: "ok", roles: await readRoles(res) };
    return { status: DENIED.has(res.status) ? "sin-acceso" : "error", roles: [] };
  } catch {
    return { status: "error", roles: [] };
  }
}

/** Fail-closed: solo un 200 abre el panel. */
export async function fetchPanelAccessStatus(): Promise<AccessStatus> {
  return (await fetchPanelAccessInfo()).status;
}

export async function fetchPanelAccess(): Promise<boolean> {
  return (await fetchPanelAccessStatus()) === "ok";
}
