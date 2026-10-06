import { resolveCreditHubFetchUrl } from "@/lib/credit-hub/api/client";
import { bankQueueExcelPath } from "@/lib/credit-hub/api/bankExperienceClient";
import { tokenStorage } from "@/lib/auth/token-storage";

export type ResultadoExportar = "descargado" | "no_disponible" | "error";

/**
 * Exportacion de la bandeja a Excel: la misma peticion que la Bandeja actual
 * (ruta, cabecera de tenant y token, con el mismo respaldo del token legado).
 * Devuelve un resultado en vez de un mensaje: el texto lo pone la pantalla.
 */
export async function exportarBandeja(tenantId: string): Promise<ResultadoExportar> {
  const token = tokenStorage.getAccessToken() ?? (typeof window !== "undefined" ? window.localStorage.getItem("nadakki_sic_token") : null);
  try {
    const res = await fetch(resolveCreditHubFetchUrl(bankQueueExcelPath()), {
      headers: { "X-Tenant-ID": tenantId, ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    });
    if (res.status === 404 || res.status === 501) return "no_disponible";
    if (!res.ok) return "error";
    const url = URL.createObjectURL(await res.blob());
    const a = document.createElement("a");
    a.href = url;
    a.download = "cola-banco.xlsx";
    a.click();
    URL.revokeObjectURL(url);
    return "descargado";
  } catch {
    return "error";
  }
}
