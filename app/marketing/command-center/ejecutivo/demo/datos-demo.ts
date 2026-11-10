/**
 * DEMO / PROTOTIPO — datos de ejemplo del diseno aprobado (Marketing Intelligence V2, 30 dias, tenant BAYLARA).
 * NO son cifras reales. Este modulo SOLO se importa con import() dinamico desde page.tsx cuando analyticsDemoActivo()
 * es verdadero (vista previa de Vercel o local con NEXT_PUBLIC_ANALYTICS_DEMO=1). Prohibido importarlo desde
 * otro lugar (lo comprueba tests/aislamiento.test.ts). Se reemplaza por el adaptador real cuando existan T6a, B2-T1 y B2-T2.
 *
 * Origen de los numeros: totales del diseno (inversion 612.40, 13 conversiones, CPA 47.11, 268 clics, 4,820 impresiones,
 * periodo anterior 546.80 y 9 conversiones). Las series diarias se derivaron de las alturas del grafico del diseno
 * y se escalaron para que sumen exactamente esos totales; los valores del periodo anterior de los indicadores secundarios
 * se derivaron de las variaciones mostradas en el diseno. Todo esta marcado DEMO.
 */
import type { Cifra } from "@/lib/analytics/cifra";
import type { PuntoSerie } from "@/lib/analytics/graficos";
import type { DatosCommandCenter, FilaCampana } from "../tipos";
import { clasificarCpa } from "../semaforo";

export const AHORA_DEMO = "2026-11-09T16:00:00Z";
const FUENTE = "DEMO · Google Ads (datos de ejemplo)";
const FECHA = "2026-11-09";
const PERIODO = { tipo: "30d" } as const;

const base = { periodo: PERIODO, fuente: FUENTE, fecha_dato: FECHA, estado: "ok" as const };

const GASTO = [19.52, 17.28, 23.77, 16.27, 22.26, 20.07, 16.07, 21.92, 15.82, 20.96, 16.23, 16.5, 20.82, 26.06, 16.94, 18.24, 23.45, 27.61, 22.81, 20.48, 28.0, 15.93, 26.47, 19.09, 17.19, 16.87, 19.31, 25.92, 17.67, 22.87];
const GASTO_ANT = [18.25, 16.48, 20.01, 14.71, 18.83, 17.36, 14.13, 17.95, 15.3, 19.13, 15.6, 16.48, 19.42, 21.19, 17.07, 17.95, 20.6, 22.37, 19.72, 18.54, 21.78, 16.19, 20.01, 17.95, 16.77, 17.36, 18.54, 20.31, 17.66, 19.14];
/** Dias (indice 0..29 desde el 11 oct) con conversion: 12 dias, 13 conversiones (el dia 14 tuvo 2). */
const CONV_DIAS: Record<number, number> = { 1: 1, 4: 1, 8: 1, 10: 1, 14: 2, 17: 1, 20: 1, 22: 1, 25: 1, 27: 1, 28: 1, 29: 1 };

function fechaDia(inicio: string, i: number): string {
  const d = new Date(`${inicio}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + i);
  return d.toISOString().slice(0, 10);
}

const serieGasto: PuntoSerie[] = GASTO.map((y, i) => ({ x: fechaDia("2026-10-11", i), y }));
const serieAnt: PuntoSerie[] = GASTO_ANT.map((y, i) => ({ x: fechaDia("2026-09-11", i), y }));
const serieConv: PuntoSerie[] = GASTO.map((_, i) => ({ x: fechaDia("2026-10-11", i), y: CONV_DIAS[i] ?? 0 }));

const cifra = (id: string, etiqueta: string, valor: number | null, valor_anterior: number | null, unidad: Cifra["unidad"], extra: Partial<Cifra> = {}): Cifra => ({
  ...base,
  id,
  etiqueta,
  valor,
  valor_anterior,
  unidad,
  ...(unidad === "moneda" ? { moneda: "USD" } : {}),
  ...extra,
});

const OBJETIVO = 50;
const EQUILIBRIO = 75;

const campana = (id: string, nombre: string, inv: number, leads: number): FilaCampana => {
  const cpaValor = leads >= 5 ? Math.round((inv / leads) * 100) / 100 : null;
  return {
    id,
    nombre,
    inversion: cifra(`${id}-inv`, "Inversión", inv, null, "moneda"),
    leads: cifra(`${id}-leads`, "Leads", leads, null, "numero"),
    cpa: cifra(`${id}-cpa`, "CPA", cpaValor, null, "moneda", cpaValor === null ? { estado: "datos_insuficientes", mensaje: "Menos de 5 conversiones" } : {}),
    lectura: clasificarCpa(cpaValor, OBJETIVO, EQUILIBRIO),
  };
};

export const DATOS_DEMO: DatosCommandCenter = {
  tenant: "BAYLARA",
  cuentas: ["Google Ads 822-···-····", "GA4 Baylara"],
  actualizado: "2026-11-09T14:00:00Z",
  dias_incompletos: 3,
  inversion: cifra("inversion", "Inversión", 612.4, 546.8, "moneda", { mejor_si: "sube" }),
  cpa: cifra("cpa", "CPA", 47.11, 52.07, "moneda", { mejor_si: "baja", mensaje: "CPA observado: inversión ÷ conversiones" }),
  leads: cifra("leads", "Leads atribuidos", 13, 9, "numero"),
  secundarias: [
    cifra("clics", "Clics", 268, 227, "numero"),
    cifra("cpc", "CPC medio", 2.29, 2.41, "moneda", { mejor_si: "baja" }),
    cifra("impresiones", "Impresiones", 4820, 4422, "numero"),
    cifra("ctr", "CTR", 5.56, 5.16, "porcentaje"),
    cifra("conversiones", "Conversiones", 13, 9, "numero"),
  ],
  serie: { gasto: serieGasto, gasto_anterior: serieAnt, conversiones: serieConv, fuente: FUENTE, fecha_dato: FECHA },
  conversiones_total: 13,
  supuestos: {
    objetivo: OBJETIVO,
    equilibrio: EQUILIBRIO,
    comision: 1500,
    tasa_cierre: 0.05,
    moneda: "USD",
    rango_probable: { min: 37, max: 65 },
    fuente: "DEMO · modelo económico de ejemplo (B2-T1/B2-T2 pendientes)",
    fecha_dato: FECHA,
  },
  campanas: [
    campana("c1", "Intracoastal Yacht Club · Alquiler", 341.2, 9),
    campana("c2", "Sunny Isles · Alquiler anual", 188.6, 3),
    campana("c3", "North Miami · Alquiler", 82.6, 1),
  ],
  decisiones: {
    negativas_propuestas: 2,
    riesgo: cifra("riesgo", "En riesgo", 40.5, null, "moneda"),
    presupuesto_propuestas: 0,
  },
  calidad: [
    { id: "etiquetado", etiqueta: "Etiquetado automático", estado: "Activo", tono: "ok" },
    { id: "conv-unica", etiqueta: "Conversión principal única", estado: "Sí", tono: "ok" },
    { id: "etiqueta", etiqueta: "Etiqueta disparando", estado: "Hace 2 h", tono: "ok" },
    { id: "ultimos", etiqueta: "Últimos 3 días", estado: "Incompletos", tono: "aviso" },
    { id: "crm", etiqueta: "Cierres reales (CRM)", estado: "Pendiente", tono: "neutro" },
  ],
};
