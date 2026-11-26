import { apiFetch } from "@/lib/api/fetch-client";
import { readLegalJson } from "@/lib/legal/parse-api-error";
import m from "@/messages/es/legal-archivo.json";

export type Nivel = "ok" | "aviso" | "lleno";
export type MetodoArchivo = "stripe" | "transferencia";
export type PaqueteArchivo = "50gb" | "250gb" | "1tb";
export type Ampliacion = {
  ampliacion_id: string;
  paquete: PaqueteArchivo;
  gb: number;
  precio_usd_mes: number;
  metodo: MetodoArchivo;
  estado: "pendiente" | "activa" | "cancelada" | "rechazada" | "vencida";
  vigente_hasta?: string | null;
  motivo?: string | null;
  created_at: string;
};
export type PlanLegal = {
  code: string;
  nombre: string;
  precio_usd_mes: number | null;
  usuarios: number | null;
  espacio_gb: number | null;
  a_cotizacion: boolean;
};
export type Catalogo = {
  planes: PlanLegal[];
  ampliaciones: { paquete: PaqueteArchivo; gb: number; precio_usd_mes: number; nombre: string }[];
  estudio_genio: { paquete: "completo" | "esencial"; nombre: string; precio_usd: number; estrategias: number; revisiones_abogado: number }[];
  umbral_aviso: number;
  metodos_disponibles: MetodoArchivo[];
  datos_transferencia: string;
};
export type Espacio = {
  usado_bytes: number;
  incluido_gb: number;
  ampliaciones_gb: number;
  total_bytes: number;
  libre_bytes: number;
  porcentaje: number;
  nivel: Nivel;
  plan: string | null;
  plan_nombre: string | null;
  ampliaciones: Ampliacion[];
  catalogo: Catalogo;
};

const base = "/api/legal/cases/archivo";
const headers = (tenantId: string) => ({ "X-Tenant-ID": tenantId.trim(), Accept: "application/json" });

export async function leerEspacio(tenantId: string): Promise<Espacio> {
  const res = await apiFetch(`${base}/espacio`, { headers: headers(tenantId) });
  const raw = await readLegalJson<Espacio>(res, m.error);
  // Una respuesta sin la forma esperada (backend viejo, proxy, simulacion) no se pinta: seria NaN.
  if (!raw || typeof raw.usado_bytes !== "number" || typeof raw.total_bytes !== "number" || raw.total_bytes <= 0
      || !raw.catalogo) {
    throw new Error(m.error);
  }
  return { ...raw, ampliaciones: raw.ampliaciones ?? [] };
}

async function post<T>(tenantId: string, path: string, body: unknown): Promise<T> {
  const res = await apiFetch(path, { method: "POST", headers: { ...headers(tenantId), "Content-Type": "application/json" }, body: JSON.stringify(body) });
  return readLegalJson<T>(res, m.error);
}

export const comprarAmpliacion = (tenantId: string, body: { paquete: PaqueteArchivo; metodo: MetodoArchivo; referencia?: string; comprobante?: string; url_retorno?: string }) =>
  post<Ampliacion & { url_pago?: string; instrucciones?: string }>(tenantId, `${base}/ampliaciones`, body);
export const verificarAmpliacion = (tenantId: string, id: string) =>
  post<Ampliacion>(tenantId, `${base}/ampliaciones/${encodeURIComponent(id)}/verificar`, {});
export const cancelarAmpliacion = (tenantId: string, id: string) =>
  post<Ampliacion>(tenantId, `${base}/ampliaciones/${encodeURIComponent(id)}/cancelar`, {});

/** 1,5 GB / 320 MB / 12 KB, en español. */
export function tamano(bytes: number): string {
  const u = [["TB", 1024 ** 4], ["GB", 1024 ** 3], ["MB", 1024 ** 2], ["KB", 1024]] as const;
  for (const [nombre, valor] of u) {
    if (bytes >= valor) {
      const n = bytes / valor;
      return `${n >= 10 ? Math.round(n) : n.toFixed(1).replace(".", ",")} ${nombre}`;
    }
  }
  return `${bytes} B`;
}

export const gb = (n: number) => (n >= 1024 && n % 1024 === 0 ? `${n / 1024} TB` : `${n} GB`);
/** US$1.500 como en el resto del panel. */
export const usd = (n: number) => `US$${Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".")}`;
