/**
 * Datos de Inicio. SOLO endpoints que responden hoy (medidos contra
 * https://api.nadakki.com el 29-sep-2026). Todo lo demas es "No disponible aun"
 * y se declara en PEDIDOS_INICIO, no se calcula ni se inventa en el frontend.
 */

import { accessApiErrorFromHttp } from "@/lib/access/client";
import { apiFetch } from "@/lib/api/fetch-client";
import { BLOQUE_TIMEOUT_MS } from "@/lib/dealer-management/bloque-estado";

/** Pedidos abiertos: su bloque usa "No disponible aun" hasta que entren. */
export const PEDIDOS_INICIO = {
  resumenFinanciero: "AUTOS-DEALER-FINANCE-SUMMARY-01",
  costosPorVehiculo: "AUTOS-VEHICLE-COSTS-READER-01",
  comisionesPorVendedor: "AUTOS-COMMISSION-SALESPERSON-01",
  cuentasPorPagar: "CONTABLE-REPORTS-MISSING-01",
} as const;

/** Tope de vehiculos a los que se les pide /days. Se declara en pantalla. */
export const TOPE_ANTIGUEDAD = 100;
const CONCURRENCIA = 6;

export type VehiculoInicio = {
  id: string;
  titulo: string;
  status: string | null;
};

export type AntiguedadInventario = {
  total: number;
  /** Vehiculos a los que si se les pudo leer la antiguedad. */
  medidos: number;
  /** true si el inventario supera TOPE_ANTIGUEDAD y se midio una parte. */
  truncado: boolean;
  promedioDias: number | null;
  tramos: { hasta30: number; hasta60: number; hasta90: number; mas90: number };
  idsMas90: string[];
};

function texto(valor: unknown): string | null {
  if (typeof valor === "string") return valor.trim() || null;
  if (typeof valor === "number" && Number.isFinite(valor)) return String(valor);
  return null;
}

function registro(valor: unknown): Record<string, unknown> | null {
  return valor && typeof valor === "object" && !Array.isArray(valor)
    ? (valor as Record<string, unknown>)
    : null;
}

function filas(body: unknown): unknown[] {
  if (Array.isArray(body)) return body;
  const rec = registro(body);
  if (!rec) return [];
  for (const clave of ["vehicles", "items", "results", "data"]) {
    if (Array.isArray(rec[clave])) return rec[clave] as unknown[];
  }
  return [];
}

/** GET con timeout duro: pasado el tope, el bloque pasa a "Error" (tabla 1). */
async function getJson(path: string, timeoutMs = BLOQUE_TIMEOUT_MS): Promise<unknown> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await apiFetch(path, {
      headers: { Accept: "application/json" },
      signal: controller.signal,
    });
    let body: unknown = null;
    try {
      body = await response.json();
    } catch {
      body = null;
    }
    if (!response.ok) throw accessApiErrorFromHttp(response.status, body, path);
    return body;
  } finally {
    clearTimeout(timer);
  }
}

export async function fetchVehiculos(dealerId: string): Promise<VehiculoInicio[]> {
  const body = await getJson(
    `/api/v1/autos/dealers/${encodeURIComponent(dealerId)}/vehicles`,
  );
  return filas(body)
    .map((valor) => {
      const rec = registro(valor);
      const id = rec ? texto(rec.id) : null;
      if (!rec || !id) return null;
      const titulo =
        [texto(rec.year) ?? texto(rec.ano), texto(rec.make) ?? texto(rec.marca), texto(rec.model) ?? texto(rec.modelo)]
          .filter(Boolean)
          .join(" ") || id;
      return { id, titulo, status: texto(rec.status) };
    })
    .filter((v): v is VehiculoInicio => v !== null);
}

async function fetchDiasVehiculo(vehicleId: string): Promise<number | null> {
  const body = await getJson(`/api/v1/autos/vehicles/${encodeURIComponent(vehicleId)}/days`);
  const rec = registro(body);
  const dias = rec?.days_in_inventory;
  if (typeof dias === "number" && Number.isFinite(dias)) return dias;
  if (typeof dias === "string" && dias.trim()) {
    const n = Number(dias);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

/** Ejecuta en tandas para no abrir N peticiones a la vez. */
async function enTandas<T, R>(items: T[], tam: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const salida: R[] = [];
  for (let i = 0; i < items.length; i += tam) {
    const tanda = await Promise.all(items.slice(i, i + tam).map(fn));
    salida.push(...tanda);
  }
  return salida;
}

/**
 * Antiguedad del inventario a partir de GET /vehicles + GET /{id}/days.
 *
 * No hay endpoint agregado: la antiguedad se lee vehiculo a vehiculo. Por eso
 * se limita a TOPE_ANTIGUEDAD y se marca `truncado`, que la pantalla declara.
 * Un vehiculo cuyo /days falle no se cuenta: no se rellena con cero.
 */
export async function fetchAntiguedad(dealerId: string): Promise<AntiguedadInventario> {
  const vehiculos = await fetchVehiculos(dealerId);
  const muestra = vehiculos.slice(0, TOPE_ANTIGUEDAD);

  const medidas = await enTandas(muestra, CONCURRENCIA, async (vehiculo) => {
    try {
      const dias = await fetchDiasVehiculo(vehiculo.id);
      return dias === null ? null : { id: vehiculo.id, dias };
    } catch {
      return null;
    }
  });

  const validas = medidas.filter((m): m is { id: string; dias: number } => m !== null);
  const tramos = { hasta30: 0, hasta60: 0, hasta90: 0, mas90: 0 };
  const idsMas90: string[] = [];

  for (const { id, dias } of validas) {
    if (dias <= 30) tramos.hasta30 += 1;
    else if (dias <= 60) tramos.hasta60 += 1;
    else if (dias <= 90) tramos.hasta90 += 1;
    else {
      tramos.mas90 += 1;
      idsMas90.push(id);
    }
  }

  const promedioDias = validas.length
    ? Math.round(validas.reduce((total, m) => total + m.dias, 0) / validas.length)
    : null;

  return {
    total: vehiculos.length,
    medidos: validas.length,
    truncado: vehiculos.length > TOPE_ANTIGUEDAD,
    promedioDias,
    tramos,
    idsMas90,
  };
}

export type LeadsInicio = { total: number; sinContactar: number };

/** Leads reales del dealer. Nunca el mock de lib/dealer/leads-mock. */
export async function fetchLeads(tenantId: string, dealerId: string): Promise<LeadsInicio> {
  const body = await getJson(
    `/api/v1/autos/tenants/${encodeURIComponent(tenantId)}/dealers/${encodeURIComponent(dealerId)}/leads`,
  );
  const items = filas(body);
  const sinContactar = items.filter((valor) => {
    const estado = texto(registro(valor)?.status)?.toLowerCase() ?? "";
    return estado === "" || estado === "new" || estado === "nuevo" || estado === "pending";
  }).length;
  return { total: items.length, sinContactar };
}

/** Mensajes sin leer, agregados de todas las solicitudes del dealer. */
export async function fetchMensajesSinLeer(): Promise<number> {
  const body = await getJson("/api/v2/credit/messages/unread-summary");
  const rec = registro(body);
  for (const clave of ["unread_count", "total_unread", "count", "total"]) {
    const valor = rec?.[clave];
    if (typeof valor === "number" && Number.isFinite(valor)) return valor;
  }
  return 0;
}
