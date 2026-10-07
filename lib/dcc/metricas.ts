/**
 * Metricas agregadas del dealer (F3-METRICAS, nadakki-ai-suite
 * services/autos_portal/dealer_metrics.py). Cada metrica llega con
 * `{metric_key, value, unit, quality: {status, covered, total}, reasons}`.
 * El backend calcula cifra y calidad; aqui solo se traduce y se formatea:
 * no se suma, no se divide y no se decide si una cifra esta completa.
 *
 * Rutas montadas en main (las dos exigen `autos.inventory.list`):
 *   GET /api/v1/autos/dealers/{dealer_id}/metrics/inventory
 *   GET /api/v1/autos/dealers/{dealer_id}/metrics/margin   (mes en curso, UTC)
 */

import type { Calidad } from "@/lib/dcc/calidad";
import { formatMonedaCompacta } from "@/lib/dcc/formato";
import { leerJson } from "@/lib/dcc/inicio";

export type MetricaDcc = {
  metricKey: string | null;
  valor: unknown;
  unidad: string | null;
  calidad: Calidad;
};

export type MetricasDcc = { periodo: string | null; metricas: Record<string, MetricaDcc> };

/** Motivos del backend en lenguaje llano: solo tooltip. Un codigo nuevo pasa tal cual. */
export const MOTIVOS: Record<string, string> = {
  MONEDA_FUNCIONAL_NO_CONFIGURADA: "Falta configurar la moneda de la empresa",
  MONEDA_SIN_CONVERSION: "Hay importes en otra moneda que no se convierten",
  UNIDADES_SIN_COMPRA: "Hay unidades en stock sin costo de compra cargado",
  UNIDADES_SIN_ADQUISICION: "Hay unidades sin fecha de ingreso al inventario",
  UNIDADES_SIN_PRECIO: "Hay unidades sin precio de venta",
  VENTAS_SIN_COMPRA: "Hay ventas del mes sin costo de compra",
  VENDIDOS_SIN_REGISTRO_DE_VENTA: "Hay unidades vendidas sin la venta registrada",
  INGRESO_CERO: "Las ventas incluidas suman cero",
};

const FORMA_INVALIDA = "La respuesta no trae esta métrica";

function registro(valor: unknown): Record<string, unknown> | null {
  return valor && typeof valor === "object" && !Array.isArray(valor) ? (valor as Record<string, unknown>) : null;
}

function entero(valor: unknown): number | null {
  return typeof valor === "number" && Number.isInteger(valor) && valor >= 0 ? valor : null;
}

function motivoDe(reasons: unknown, total: number | null, vacio: string): string | null {
  const codigos = Array.isArray(reasons) ? reasons.filter((r): r is string => typeof r === "string" && r.trim() !== "") : [];
  if (codigos.length) return codigos.map((c) => MOTIVOS[c] ?? c).join(" · ");
  return total === 0 ? vacio : null;
}

/**
 * Una metrica del backend. `vacio` es el motivo cuando el universo es 0
 * (sin unidades, sin ventas). Forma desconocida = no disponible, sin cifra.
 */
export function metricaDesdeBackend(raw: unknown, vacio: string): MetricaDcc {
  const m = registro(raw);
  const q = registro(m?.quality);
  const metricKey = typeof m?.metric_key === "string" ? m.metric_key : null;
  if (!m || !q) return { metricKey, valor: null, unidad: null, calidad: { estado: "no_disponible", motivo: FORMA_INVALIDA, delBackend: true } };
  const cubiertos = entero(q.covered);
  const total = entero(q.total);
  const motivo = motivoDe(m.reasons, total, vacio);
  const unidad = typeof m.unit === "string" ? m.unit : null;
  let calidad: Calidad;
  switch (q.status) {
    case "VERIFICADA":
      calidad = { estado: "verificado" };
      break;
    case "PARCIAL": {
      const coherente = cubiertos !== null && total !== null && cubiertos <= total;
      calidad = { estado: "parcial", cubiertos: coherente ? cubiertos : null, total: coherente ? total : null, motivo };
      break;
    }
    default:
      calidad = { estado: "no_disponible", motivo: motivo ?? FORMA_INVALIDA, delBackend: true };
  }
  return { metricKey, valor: m.value ?? null, unidad, calidad };
}

function metricasDe(body: unknown, vacio: string): MetricasDcc {
  const rec = registro(body);
  const metricas = registro(rec?.metrics);
  if (!rec || !metricas) throw new Error("DCC_RESPUESTA_SIN_METRICAS");
  return {
    periodo: typeof rec.period === "string" ? rec.period : null,
    metricas: Object.fromEntries(Object.entries(metricas).map(([k, v]) => [k, metricaDesdeBackend(v, vacio)])),
  };
}

/** inventory_units, inventory_capital, inventory_age_days, potential_revenue. */
export async function fetchMetricasInventario(dealerId: string): Promise<MetricasDcc> {
  const body = await leerJson(`/api/v1/autos/dealers/${encodeURIComponent(dealerId)}/metrics/inventory`);
  return metricasDe(body, "Sin unidades en stock");
}

/** gross_margin y gross_margin_pct del mes en curso. */
export async function fetchMargenDelMes(dealerId: string): Promise<MetricasDcc> {
  const body = await leerJson(`/api/v1/autos/dealers/${encodeURIComponent(dealerId)}/metrics/margin`);
  return metricasDe(body, "Sin ventas registradas este mes");
}

/** Lo que pinta una tarjeta: cifra ya formateada (o null) y su sello. */
export type Presentada = { valor: string | null; calidad: Calidad };

const NO_ESTA = (clave: string): Presentada => ({
  valor: null,
  calidad: { estado: "no_disponible", motivo: `${FORMA_INVALIDA} (${clave})`, delBackend: true },
});

/** Con sello que permite cifra pero un valor que no se puede escribir, la tarjeta no inventa. */
function presentar(m: MetricaDcc, texto: string | null): Presentada {
  if (m.calidad.estado !== "verificado" && m.calidad.estado !== "parcial") return { valor: null, calidad: m.calidad };
  if (texto === null) return { valor: null, calidad: { estado: "no_disponible", motivo: FORMA_INVALIDA, delBackend: true } };
  return { valor: texto, calidad: m.calidad };
}

/** Importe compacto en la moneda que DECLARA la metrica (`unit`, moneda funcional). */
export function presentarImporte(metricas: MetricasDcc | undefined, clave: string, locale: string): Presentada {
  const m = metricas?.metricas[clave];
  if (!m) return NO_ESTA(clave);
  const moneda = m.unidad && /^[A-Z]{3}$/.test(m.unidad) ? m.unidad : null;
  const numero = typeof m.valor === "string" || typeof m.valor === "number" ? Number(m.valor) : NaN;
  return presentar(m, moneda ? formatMonedaCompacta(numero, { locale, currency: moneda }) : null);
}

/** Porcentaje que ya calculo el backend (0-100): se escribe tal cual. */
export function presentarPorcentaje(metricas: MetricasDcc | undefined, clave: string, locale: string): Presentada {
  const m = metricas?.metricas[clave];
  if (!m) return NO_ESTA(clave);
  const ok = typeof m.valor === "number" && Number.isFinite(m.valor);
  return presentar(m, ok ? `${new Intl.NumberFormat(locale, { maximumFractionDigits: 2 }).format(m.valor as number)} %` : null);
}

/** Dias en inventario: promedio (cifra) y maximo (nota), ambos del backend. */
export function presentarDias(metricas: MetricasDcc | undefined, locale: string): Presentada & { maximo: string | null } {
  const m = metricas?.metricas.inventory_age_days;
  if (!m) return { ...NO_ESTA("inventory_age_days"), maximo: null };
  const v = registro(m.valor);
  const avg = typeof v?.avg === "number" && Number.isFinite(v.avg) ? v.avg : null;
  const max = typeof v?.max === "number" && Number.isFinite(v.max) ? v.max : null;
  const fmt = (n: number) => new Intl.NumberFormat(locale, { maximumFractionDigits: 1 }).format(n);
  const p = presentar(m, avg === null ? null : fmt(avg));
  return { ...p, maximo: p.valor !== null && max !== null ? fmt(max) : null };
}
