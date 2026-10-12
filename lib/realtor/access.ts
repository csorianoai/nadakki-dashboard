import { apiFetch } from "@/lib/api/fetch-client";
import { ACCESS_PATH } from "./config";

/** Fail-closed: solo un 200 abre el panel; otro estado o error de red lo cierra. La identidad sale del token. */
export async function fetchPanelAccess(): Promise<boolean> {
  try {
    const res = await apiFetch(ACCESS_PATH, { method: "GET", cache: "no-store" });
    return res.status === 200;
  } catch {
    return false;
  }
}
