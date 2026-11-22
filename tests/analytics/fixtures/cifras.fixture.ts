/**
 * PROTOTIPO — fixtures deterministas SOLO para tests y capturas.
 * Estos numeros NO son datos reales de ningun tenant. Prohibido importarlos desde
 * components/analytics/kit o lib/analytics (lo comprueba tests/analytics/aislamiento.test.ts).
 */
import type { Cifra, PeriodoAnalitica } from "@/lib/analytics/cifra";

export const PERIODO_30D: PeriodoAnalitica = { tipo: "30d" };

export const FECHA_FIJA = "2026-11-10";

const base = {
  periodo: PERIODO_30D,
  fuente: "PROTOTIPO · fixture de pruebas",
  fecha_dato: FECHA_FIJA,
  estado: "ok" as const,
};

export const CIFRA_SUBE: Cifra = { ...base, id: "leads", etiqueta: "Leads nuevos", valor: 120, valor_anterior: 100, unidad: "numero" };
export const CIFRA_BAJA: Cifra = { ...base, id: "ctr", etiqueta: "CTR", valor: 1.5, valor_anterior: 2, unidad: "porcentaje" };
export const CIFRA_IGUAL: Cifra = { ...base, id: "conv", etiqueta: "Conversiones", valor: 40, valor_anterior: 40, unidad: "numero" };
export const CIFRA_ANTERIOR_CERO: Cifra = { ...base, id: "cero", etiqueta: "Visitas", valor: 10, valor_anterior: 0, unidad: "numero" };
export const CIFRA_ANTERIOR_NULO: Cifra = { ...base, id: "nulo", etiqueta: "Visitas", valor: 10, valor_anterior: null, unidad: "numero" };
export const CIFRA_SIN_FUENTE: Cifra = { ...base, id: "sinfuente", etiqueta: "Costo", valor: 5, valor_anterior: 4, unidad: "numero", fuente: null };
export const CIFRA_SIN_FECHA: Cifra = { ...base, id: "sinfecha", etiqueta: "Costo", valor: 5, valor_anterior: 4, unidad: "numero", fecha_dato: null };
export const CIFRA_COSTO_SUBE: Cifra = { ...base, id: "cpa", etiqueta: "Costo por lead", valor: 12, valor_anterior: 10, unidad: "moneda", moneda: "USD", mejor_si: "baja" };
export const CIFRA_NO_FINITA: Cifra = { ...base, id: "nan", etiqueta: "Ratio", valor: Number.NaN, valor_anterior: 3, unidad: "numero" };
