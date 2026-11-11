import type { Cifra, PeriodoAnalitica, UnidadCifra } from "@/lib/analytics/cifra";
import type { PuntoSerie } from "@/lib/analytics/graficos";
import { rangoValido } from "@/lib/analytics/periodo";
import type { CuentaInsights, KpiInsights, MetricaInsights, ResumenInsights } from "./contrato";
import { MIN_CONVERSIONES, clasificarCpa } from "./semaforo";
import type { DatosCommandCenter, FilaCalidad, FilaCampana, SupuestosEconomicos } from "./tipos";

/**
 * Adaptador REAL (puro, sin red): contrato del backend -> DatosCommandCenter. Reglas:
 *  - Moneda: la de la cuenta de Google Ads (`currency.code`, solo si `confirmed`). Sin ella las cifras de dinero se muestran como
 *    NUMERO (sin simbolo ni codigo): nunca se supone la moneda del tenant ni USD. TenantBranding solo da el locale (FormatoProvider).
 *  - Nada inventado: lo que el backend no da (leads de CRM, supuestos B2-T1, semaforo B2-T2, decisiones) queda null/pendiente.
 *  - Una cifra sin `as_of` no tiene fecha del dato y el kit la muestra como "pendiente de integracion".
 */
export const FUENTE_REAL = "Google Ads · tablas diarias (sync)";
export const TEXTO_MONEDA_NO_CONFIRMADA = "Moneda no confirmada: las cifras de dinero se muestran sin símbolo.";

export type ResultadoAdaptacion =
  | { tipo: "datos"; datos: DatosCommandCenter; moneda: string | null }
  | { tipo: "requiere_cuenta"; cuentas: CuentaInsights[] }
  | { tipo: "vacio"; motivo: "sin_tablas" | "sin_filas" };

const MS_DIA = 86_400_000;

/** Rango [from, to] (YYYY-MM-DD, UTC) del periodo; null si el personalizado no es valido. `hoy` = instante de referencia. */
export function rangoDePeriodo(periodo: PeriodoAnalitica, hoy: Date): { from: string; to: string } | null {
  if (periodo.tipo === "personalizado") return rangoValido(periodo.desde, periodo.hasta) ? { from: periodo.desde, to: periodo.hasta } : null;
  const dias = periodo.tipo === "7d" ? 7 : periodo.tipo === "30d" ? 30 : 90;
  const to = new Date(Date.UTC(hoy.getUTCFullYear(), hoy.getUTCMonth(), hoy.getUTCDate()));
  const from = new Date(to.getTime() - (dias - 1) * MS_DIA);
  return { from: from.toISOString().slice(0, 10), to: to.toISOString().slice(0, 10) };
}

const finito = (n: unknown): n is number => typeof n === "number" && Number.isFinite(n);
const num = (n: unknown): number | null => (finito(n) ? n : null);

function fechaDe(iso: string | null): string | null {
  return iso && Number.isFinite(Date.parse(iso)) ? iso : null;
}

interface Ctx {
  periodo: PeriodoAnalitica;
  moneda: string | null;
  fecha: string | null;
}

function cifraDe(ctx: Ctx, id: string, etiqueta: string, k: KpiInsights | undefined, unidad: UnidadCifra, extra: Partial<Cifra> = {}, escala = 1): Cifra {
  const dinero = unidad === "moneda";
  const valor = num(k?.value);
  const previo = num(k?.previous);
  const estado = !k || k.status === "sin_datos" ? "vacio" : k.status === "datos_insuficientes" ? "datos_insuficientes" : "ok";
  return {
    id,
    etiqueta,
    valor: valor === null ? null : valor * escala,
    valor_anterior: previo === null ? null : previo * escala,
    unidad: dinero && !ctx.moneda ? "numero" : unidad,
    ...(dinero && ctx.moneda ? { moneda: ctx.moneda } : {}),
    periodo: ctx.periodo,
    fuente: FUENTE_REAL,
    fecha_dato: ctx.fecha,
    estado,
    ...(dinero && !ctx.moneda ? { mensaje: "Moneda no confirmada" } : {}),
    ...extra,
  };
}

function puntos(serie: ResumenInsights["series"], campo: "spend" | "clicks" | "conversions"): PuntoSerie[] {
  return (serie ?? []).map((p) => ({ x: p.date, y: num(p[campo]) }));
}

function etiquetaCuenta(c: CuentaInsights): string {
  return `Google Ads ${c.label}`;
}

export function adaptarResumen(r: ResumenInsights, periodo: PeriodoAnalitica, opciones: { nombreTenant?: string | null } = {}): ResultadoAdaptacion {
  if (r.requires_account_selection) return { tipo: "requiere_cuenta", cuentas: r.accounts ?? [] };
  if (!r.coverage?.tables_present) return { tipo: "vacio", motivo: "sin_tablas" };
  const k = r.kpis ?? {};
  const hayDatos = (r.coverage.days_with_data ?? 0) > 0 && Object.values(k).some((v) => v && v.status !== "sin_datos");
  if (!hayDatos) return { tipo: "vacio", motivo: "sin_filas" };

  const moneda = r.currency?.confirmed && r.currency.code ? r.currency.code.toUpperCase() : null;
  const fecha = fechaDe(r.as_of);
  const ctx: Ctx = { periodo, moneda, fecha };
  const c = (m: MetricaInsights, id: string, etiqueta: string, unidad: UnidadCifra, extra: Partial<Cifra> = {}, escala = 1) =>
    cifraDe(ctx, id, etiqueta, k[m], unidad, extra, escala);

  const conversiones = num(k.conversions?.value);
  const serieGasto = puntos(r.series, "spend");
  const campanas: FilaCampana[] = (r.campaigns ?? []).map((f) => {
    const conv = num(f.conversions);
    const suficiente = conv !== null && conv >= MIN_CONVERSIONES;
    const cpaValor = suficiente ? num(f.cpa) : null;
    const id = String(f.campaign_id);
    const cifraCampana = (sufijo: string, etiqueta: string, valor: number | null, unidad: UnidadCifra, extra: Partial<Cifra> = {}): Cifra =>
      cifraDe(ctx, `${id}-${sufijo}`, etiqueta, { value: valor, previous: null, delta_pct: null, status: valor === null ? "sin_datos" : "ok" }, unidad, extra);
    return {
      id,
      nombre: f.name,
      inversion: cifraCampana("inv", "Inversión", num(f.spend), "moneda"),
      leads: cifraCampana("leads", "Leads (conversiones)", conv, "numero"),
      cpa: cifraCampana("cpa", "CPA", cpaValor, "moneda", cpaValor === null ? { estado: "datos_insuficientes", mensaje: `Menos de ${MIN_CONVERSIONES} conversiones` } : {}),
      // Sin objetivo ni equilibrio (B2-T1 no tiene API) la lectura es siempre "datos_insuficientes": sin juicio de rentabilidad.
      lectura: clasificarCpa(cpaValor, null, null),
    };
  });

  const completos = r.coverage.days_with_data >= r.coverage.days_in_period;
  const calidad: FilaCalidad[] = [
    {
      id: "cobertura",
      etiqueta: "Días con datos",
      estado: `${r.coverage.days_with_data} de ${r.coverage.days_in_period}`,
      tono: completos ? "ok" : "aviso",
    },
    { id: "ultimos", etiqueta: `Últimos ${r.last_days_may_change} días`, estado: "Pueden cambiar", tono: "aviso" },
    { id: "moneda", etiqueta: "Moneda de la cuenta", estado: moneda ?? "No confirmada", tono: moneda ? "ok" : "aviso" },
    { id: "crm", etiqueta: "Cierres reales (CRM)", estado: "Pendiente", tono: "neutro" },
  ];

  const supuestos: SupuestosEconomicos = {
    objetivo: null,
    equilibrio: null,
    comision: null,
    tasa_cierre: null,
    moneda: moneda ?? "",
    rango_probable: null,
    fuente: null,
    fecha_dato: null,
    cierres_crm: null,
  };

  return {
    tipo: "datos",
    moneda,
    datos: {
      tenant: opciones.nombreTenant?.trim() || "Marketing Intelligence",
      cuentas: (r.accounts ?? []).map(etiquetaCuenta),
      actualizado: fecha ?? "",
      dias_incompletos: Math.max(0, r.last_days_may_change ?? 0),
      inversion: c("spend", "inversion", "Inversión", "moneda", { mejor_si: "sube" }),
      cpa: c("cpa", "cpa", "CPA", "moneda", { mejor_si: "baja", mensaje: "CPA observado: inversión ÷ conversiones" }),
      leads: c("conversions", "leads", "Leads (conversiones)", "numero"),
      secundarias: [
        c("clicks", "clics", "Clics", "numero"),
        c("avg_cpc", "cpc", "CPC medio", "moneda", { mejor_si: "baja" }),
        c("impressions", "impresiones", "Impresiones", "numero"),
        c("ctr", "ctr", "CTR", "porcentaje", {}, 100),
        c("conversions", "conversiones", "Conversiones", "numero"),
      ],
      serie: {
        gasto: serieGasto,
        gasto_anterior: puntos(r.previous_series, "spend"),
        conversiones: puntos(r.series, "conversions"),
        fuente: FUENTE_REAL,
        fecha_dato: fecha,
      },
      conversiones_total: conversiones,
      supuestos,
      campanas,
      decisiones: { negativas_propuestas: null, riesgo: null, presupuesto_propuestas: null },
      calidad,
    },
  };
}
