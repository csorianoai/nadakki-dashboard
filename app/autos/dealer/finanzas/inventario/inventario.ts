/**
 * Cliente y logica pura de Finanzas del inventario (F4E-2) sobre
 * GET /api/v1/contable/reports/inventario-por-unidad (F4E-1).
 *
 * El tenant sale del token. Los totales que se pintan son `total` y
 * `totales_por_moneda` del endpoint: aqui nunca se suma para mostrar un total.
 * La moneda la devuelve el endpoint; sin ella se falla cerrado. El margen solo
 * existe si el endpoint lo manda (autos.margin.view).
 */

import { apiFetch } from "@/lib/api/fetch-client";

export const RUTA_INVENTARIO = "/api/v1/contable/reports/inventario-por-unidad";

export type Filtros = { marca: string; estado: string; desde: string; hasta: string };
export const SIN_FILTROS: Filtros = { marca: "", estado: "", desde: "", hasta: "" };

export const filtrosDeParams = (p: URLSearchParams): Filtros => ({
  marca: p.get("marca")?.trim() ?? "",
  estado: p.get("estado")?.trim() ?? "",
  desde: p.get("adquirido_desde")?.trim() ?? "",
  hasta: p.get("adquirido_hasta")?.trim() ?? "",
});

/** Misma query para la vista (URL compartible), el JSON y el CSV. */
export function queryDeFiltros(f: Filtros, extra: Record<string, string> = {}): string {
  const q = new URLSearchParams();
  if (f.marca.trim()) q.set("marca", f.marca.trim());
  if (f.estado) q.set("estado", f.estado);
  if (f.desde) q.set("adquirido_desde", f.desde);
  if (f.hasta) q.set("adquirido_hasta", f.hasta);
  for (const [k, v] of Object.entries(extra)) q.set(k, v);
  return q.toString();
}
const conQuery = (qs: string) => (qs ? `${RUTA_INVENTARIO}?${qs}` : RUTA_INVENTARIO);
export const inventarioPath = (f: Filtros) => conQuery(queryDeFiltros(f));
export const inventarioCsvPath = (f: Filtros) => conQuery(queryDeFiltros(f, { formato: "csv" }));

export type Monto = { currency: string; total: number };
export type UnidadFila = {
  vehicle_id: string;
  stock_number: string;
  make: string;
  model: string;
  year: number | null;
  status: string;
  acquired_at: string;
  dias_en_stock: number | null;
  costos: Monto[];
  precio_lista: number | null;
  moneda_precio: string;
  margen_esperado: number | null;
};
export type InventarioReporte = {
  moneda: string;
  total: number;
  totalesPorMoneda: Monto[];
  filas: UnidadFila[];
  /** true solo si alguna fila trae precio o margen: sin ellos no se pinta nada de margen. */
  hayMargen: boolean;
};

const num = (v: unknown): number | null => {
  const n = typeof v === "string" && v.trim() !== "" ? Number(v) : v;
  return typeof n === "number" && Number.isFinite(n) ? n : null;
};
const texto = (v: unknown): string => (typeof v === "string" ? v.trim() : "");
const lista = (v: unknown): Record<string, unknown>[] =>
  Array.isArray(v) ? v.filter((x): x is Record<string, unknown> => typeof x === "object" && x !== null) : [];
const montos = (v: unknown): Monto[] =>
  lista(v).flatMap((x) => {
    const t = num(x.total);
    const currency = texto(x.currency).toUpperCase();
    return t === null || !currency ? [] : [{ currency, total: t }];
  });

export function parseInventario(body: unknown): InventarioReporte {
  const crudo = (typeof body === "object" && body !== null ? body : {}) as Record<string, unknown>;
  const moneda = texto(crudo.moneda).toUpperCase();
  const total = num(crudo.total);
  if (!moneda || total === null) throw new Error("INVENTARIO_RESPUESTA_INVALIDA");
  const filas = lista(crudo.filas).flatMap((f): UnidadFila[] => {
    const vehicle_id = texto(f.vehicle_id);
    if (!vehicle_id) return [];
    return [
      {
        vehicle_id,
        stock_number: texto(f.stock_number),
        make: texto(f.make),
        model: texto(f.model),
        year: num(f.year),
        status: texto(f.status),
        acquired_at: texto(f.acquired_at),
        dias_en_stock: num(f.dias_en_stock),
        costos: montos(f.costos),
        precio_lista: num(f.precio_lista),
        moneda_precio: texto(f.moneda_precio).toUpperCase(),
        margen_esperado: num(f.margen_esperado),
      },
    ];
  });
  const hayMargen = filas.some((f) => f.precio_lista !== null || f.margen_esperado !== null);
  return { moneda, total, totalesPorMoneda: montos(crudo.totales_por_moneda), filas, hayMargen };
}

export async function fetchInventario(f: Filtros): Promise<InventarioReporte> {
  const response = await apiFetch(inventarioPath(f), { headers: { Accept: "application/json" } });
  if (!response.ok) throw new Error(`HTTP_${response.status}`);
  return parseInventario(await response.json());
}

/** CSV del mismo endpoint y los mismos filtros. */
export async function fetchInventarioCsv(f: Filtros): Promise<Blob> {
  const response = await apiFetch(inventarioCsvPath(f), { headers: { Accept: "text/csv" } });
  if (!response.ok) throw new Error(`HTTP_${response.status}`);
  return response.blob();
}

/** "Toyota Hilux 2021 · S-001": la unidad se nombra, nunca con su id. */
export function etiquetaUnidad(f: UnidadFila): string {
  const nombre = [f.make, f.model, f.year].filter((x) => x !== "" && x !== null).join(" ");
  return [nombre || "Unidad", f.stock_number && `· ${f.stock_number}`].filter(Boolean).join(" ");
}

/** Costo en la moneda funcional; null si la unidad no tiene costos en ella. */
export const costoEnMoneda = (f: UnidadFila, moneda: string): number | null => {
  const propios = f.costos.filter((c) => c.currency === moneda);
  return propios.length ? propios.reduce((a, c) => a + c.total, 0) : null;
};
