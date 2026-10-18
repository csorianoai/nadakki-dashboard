import { apiFetch } from "@/lib/api/fetch-client";
import { BASE_OLA3 } from "./api";

export type DownloadFailure = "not_found" | "gone" | "error";
export type DownloadResult = { ok: true } | { ok: false; reason: DownloadFailure };

/** Nombre de Content-Disposition (filename* RFC 5987 primero); sin rutas; si no hay, `fallback`. */
export function filenameFromDisposition(cd: string | null | undefined, fallback: string): string {
  let name = "";
  const ext = cd?.match(/filename\*\s*=\s*[\w-]+'[^']*'([^;]+)/i);
  if (ext) {
    try {
      name = decodeURIComponent(ext[1].trim());
    } catch {
      name = "";
    }
  }
  if (!name) {
    const plain = cd?.match(/filename\s*=\s*(?:"([^"]*)"|([^;]+))/i);
    name = (plain?.[1] ?? plain?.[2] ?? "").trim();
  }
  name = name.split(/[\\/]/).pop()?.trim() ?? "";
  return name && name !== "." && name !== ".." ? name : fallback;
}

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
    a.download = filenameFromDisposition(res.headers?.get("Content-Disposition"), filename);
    a.rel = "noopener";
    a.click();
    // Diferido: revocar justo tras click() cancela la descarga en Firefox/Safari.
    setTimeout(() => URL.revokeObjectURL(url), 10_000);
    return { ok: true };
  } catch {
    return { ok: false, reason: "error" };
  }
}
