/**
 * Logica de Analisis de Costos y Analisis de Gastos (F2).
 *
 * Los dos reportes son los lectores de F1 (`/api/v1/contable/reports/...`). El
 * tenant sale del token: ni la ruta ni la query ni una cabecera lo llevan. Los
 * totales que se pintan son los `total` del endpoint; aqui solo se agrupa para
 * las barras, y las barras suman lo mismo porque parten de las mismas filas.
 * La moneda es la funcional del tenant que devuelve el endpoint: sin ella se
 * falla cerrado, nunca se inventa una.
 */

import { apiFetch } from "@/lib/api/fetch-client";

export type Periodo = "3m" | "6m" | "12m" | "anio" | "todo";
export const PERIODOS: { valor: Periodo; etiqueta: string }[] = [
  { valor: "3m", etiqueta: "Últimos 3 meses" },
  { valor: "6m", etiqueta: "Últimos 6 meses" },
  { valor: "12m", etiqueta: "Últimos 12 meses" },
  { valor: "anio", etiqueta: "Este año" },
  { valor: "todo", etiqueta: "Todo el historial" },
];

export type Rango = { desde?: string; hasta?: string };

const dos = (n: number) => String(n).padStart(2, "0");
const iso = (d: Date) => `${d.getFullYear()}-${dos(d.getMonth() + 1)}-${dos(d.getDate())}`;

/** Del primer dia del mes inicial hasta hoy: los meses se leen completos. */
export function rangoDePeriodo(periodo: Periodo, hoy: Date = new Date()): Rango {
  if (periodo === "todo") return {};
  const meses = { "3m": 3, "6m": 6, "12m": 12 }[periodo as "3m" | "6m" | "12m"];
  const inicio =
    periodo === "anio" ? new Date(hoy.getFullYear(), 0, 1) : new Date(hoy.getFullYear(), hoy.getMonth() - (meses - 1), 1);
  return { desde: iso(inicio), hasta: iso(hoy) };
}

export type Reporte = "costos" | "gastos";
const RUTAS: Record<Reporte, string> = {
  costos: "/api/v1/contable/reports/costos-por-vehiculo-tipo-mes",
  gastos: "/api/v1/contable/reports/gastos-por-cuenta-mes",
};

export function reportePath(reporte: Reporte, rango: Rango): string {
  const q = new URLSearchParams();
  if (rango.desde) q.set("desde", rango.desde);
  if (rango.hasta) q.set("hasta", rango.hasta);
  const qs = q.toString();
  return qs ? `${RUTAS[reporte]}?${qs}` : RUTAS[reporte];
}

export type CostoFila = { vehicle_id: string; cost_type: string; mes: string; currency: string; total: number };
export type GastoFila = { mes: string; codigo: string; nombre: string; total: number };
export type CostosReporte = {
  moneda: string;
  total: number;
  filas: CostoFila[];
  totalesPorMoneda: { currency: string; total: number }[];
};
export type GastosReporte = { moneda: string; total: number; filas: GastoFila[] };

const num = (v: unknown): number | null => {
  const n = typeof v === "string" && v.trim() !== "" ? Number(v) : v;
  return typeof n === "number" && Number.isFinite(n) ? n : null;
};
const texto = (v: unknown): string => (typeof v === "string" ? v.trim() : "");
const lista = (v: unknown): Record<string, unknown>[] =>
  Array.isArray(v) ? v.filter((x): x is Record<string, unknown> => typeof x === "object" && x !== null) : [];

function cabecera(body: unknown): { moneda: string; total: number; crudo: Record<string, unknown> } {
  const crudo = (typeof body === "object" && body !== null ? body : {}) as Record<string, unknown>;
  const moneda = texto(crudo.moneda).toUpperCase();
  const total = num(crudo.total);
  if (!moneda || total === null) throw new Error("ANALISIS_RESPUESTA_INVALIDA");
  return { moneda, total, crudo };
}

export function parseCostos(body: unknown): CostosReporte {
  const { moneda, total, crudo } = cabecera(body);
  const filas = lista(crudo.filas).flatMap((f): CostoFila[] => {
    const t = num(f.total);
    const vehicle_id = texto(f.vehicle_id);
    const currency = texto(f.currency).toUpperCase();
    if (t === null || !vehicle_id || !currency) return [];
    return [{ vehicle_id, cost_type: texto(f.cost_type), mes: texto(f.mes), currency, total: t }];
  });
  const totalesPorMoneda = lista(crudo.totales_por_moneda).flatMap((x) => {
    const t = num(x.total);
    return t === null || !texto(x.currency) ? [] : [{ currency: texto(x.currency).toUpperCase(), total: t }];
  });
  return { moneda, total, filas, totalesPorMoneda };
}

export function parseGastos(body: unknown): GastosReporte {
  const { moneda, total, crudo } = cabecera(body);
  const filas = lista(crudo.filas).flatMap((f): GastoFila[] => {
    const t = num(f.total);
    return t === null || !texto(f.codigo) ? [] : [{ mes: texto(f.mes), codigo: texto(f.codigo), nombre: texto(f.nombre), total: t }];
  });
  return { moneda, total, filas };
}

async function pedir<T>(reporte: Reporte, rango: Rango, parse: (b: unknown) => T): Promise<T> {
  const path = reportePath(reporte, rango);
  const response = await apiFetch(path, { headers: { Accept: "application/json" } });
  if (!response.ok) throw new Error(`HTTP_${response.status}`);
  return parse(await response.json());
}
export const fetchCostos = (rango: Rango) => pedir("costos", rango, parseCostos);
export const fetchGastos = (rango: Rango) => pedir("gastos", rango, parseGastos);

export type Barra = { clave: string; total: number };

/** Suma por clave. Por defecto de mayor a menor; con "clave", cronologico/alfabetico. */
export function agrupar<T extends { total: number }>(
  filas: T[],
  clave: (fila: T) => string,
  orden: "total" | "clave" = "total",
): Barra[] {
  const acc = new Map<string, number>();
  for (const f of filas) acc.set(clave(f), (acc.get(clave(f)) ?? 0) + f.total);
  const barras = [...acc].map(([k, total]) => ({ clave: k, total }));
  return barras.sort((a, b) => (orden === "clave" ? a.clave.localeCompare(b.clave) : b.total - a.total));
}

export const hrefVehiculo = (id: string) => `/autos/dealer/inventario/${encodeURIComponent(id)}`;

// Cuenta y mes NO enlazan a /contable/libro-mayor: esa pantalla no lee query params
// (elige la primera cuenta/periodo) y mostraria un saldo ajeno. Se filtran dentro de la
// propia pantalla con `onElegir` de BarrasAnalisis.
