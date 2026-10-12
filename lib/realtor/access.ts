import { apiFetch } from "@/lib/api/fetch-client";
import { ACCESS_PATH } from "./config";

/** ok: 200. sin-acceso: el backend lo niega (401, 403, 404). error: otro estado o fallo de red. */
export type AccessStatus = "ok" | "sin-acceso" | "error";

const DENIED = new Set([401, 403, 404]);

/** Fail-closed: solo un 200 abre el panel. La identidad sale del token: el cliente no envía nada más. */
export async function fetchPanelAccessStatus(): Promise<AccessStatus> {
  try {
    const res = await apiFetch(ACCESS_PATH, { method: "GET", cache: "no-store" });
    if (res.status === 200) return "ok";
    return DENIED.has(res.status) ? "sin-acceso" : "error";
  } catch {
    return "error";
  }
}

export async function fetchPanelAccess(): Promise<boolean> {
  return (await fetchPanelAccessStatus()) === "ok";
}
