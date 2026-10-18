import { apiFetch } from "@/lib/api/fetch-client";
import { BASE_OLA3 } from "./api";

export type DownloadFailure = "not_found" | "gone" | "error";
export type DownloadResult = { ok: true } | { ok: false; reason: DownloadFailure };

/**
 * GET /documents/{id}/download same-origin. apiFetch añade el JWT; no se envía ninguna otra cabecera.
 * El servidor redirige al almacén: el cliente solo recibe el blob, nunca conoce ni escribe la URL del almacén.
 */
export async function downloadDocument(id: string, filename: string): Promise<DownloadResult> {
  try {
    const res = await apiFetch(`${BASE_OLA3}/documents/${encodeURIComponent(id)}/download`, { method: "GET" });
    if (res.status === 404) return { ok: false, reason: "not_found" };
    if (res.status === 410) return { ok: false, reason: "gone" };
    if (res.status !== 200) return { ok: false, reason: "error" };
    const url = URL.createObjectURL(await res.blob());
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.rel = "noopener";
    a.click();
    URL.revokeObjectURL(url);
    return { ok: true };
  } catch {
    return { ok: false, reason: "error" };
  }
}
