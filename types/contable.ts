/**
 * Contable Sub-fase 3.1 — types aligned with /api/v1/contable/* (Stream B).
 */

export type TipoCuenta =
  | "activo"
  | "pasivo"
  | "patrimonio"
  | "ingreso"
  | "gasto"
  | "costo"
  | "orden";

export type NaturalezaCuenta = "deudora" | "acreedora";

export type PeriodoStatus = "open" | "soft_closed" | "locked";

export type AsientoStatus = "draft" | "posted" | "reversed";

/**
 * Moneda de un asiento: codigo ISO-4217 de tres letras, el que venga del
 * backend. NO es una lista cerrada.
 *
 * Era `"DOP" | "USD"`, y eso dejaba a un tenant argentino sin poder registrar un
 * asiento en ARS: dinero incorrecto, no un detalle de tipos. El backend no cierra
 * la lista --`services/contable/fx.py:35-39` solo exige tres letras y lanza
 * `D4_MONEDA` si no lo son-- y la moneda funcional la resuelve
 * `legal_entities.functional_currency` sin fallback
 * (`services/contable/functional_currency.py:29-62`,
 * `FUNCTIONAL_CURRENCY_NOT_CONFIGURED`).
 *
 * Se valida con `esIso4217` (lib/contable/moneda-asiento.ts), no con un union.
 */
export type ContableCurrency = string;

export interface CuentaContable {
  id: string;
  tenant_id: string;
  codigo: string;
  nombre: string;
  tipo_cuenta: TipoCuenta;
  naturaleza: NaturalezaCuenta;
  cuenta_padre_id?: string | null;
  nivel: number;
  activa: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateCuentaPayload {
  codigo: string;
  nombre: string;
  tipo_cuenta: TipoCuenta;
  naturaleza: NaturalezaCuenta;
  cuenta_padre_id?: string | null;
  activa?: boolean;
}

export interface UpdateCuentaPayload {
  nombre?: string;
  tipo_cuenta?: TipoCuenta;
  naturaleza?: NaturalezaCuenta;
  activa?: boolean;
}

export interface PlanCuentasFilters {
  tipo_cuenta?: TipoCuenta;
  activa?: boolean;
  search?: string;
}

export interface PeriodoContable {
  id: string;
  tenant_id: string;
  fiscal_year: number;
  period_number: number;
  label: string;
  status: PeriodoStatus;
  fecha_inicio: string;
  fecha_fin: string;
}

export interface AsientoLineaInput {
  id?: string;
  cuenta_id: string;
  descripcion?: string;
  debe_original: number;
  haber_original: number;
}

export interface AsientoLinea extends AsientoLineaInput {
  cuenta_codigo?: string;
  cuenta_nombre?: string;
  debe_base: number;
  haber_base: number;
}

export interface AsientoContable {
  id: string;
  tenant_id: string;
  periodo_id: string;
  numero_asiento?: string;
  fecha: string;
  descripcion: string;
  /** Moneda del asiento. `null` si el backend no la informa: no se inventa. */
  currency: ContableCurrency | null;
  exchange_rate: number;
  /**
   * Moneda funcional con la que el backend valoro el asiento; la devuelve el
   * contrato (`asientos_router.py:296-298`) y el frontend la tiraba. Opcional
   * porque el mapper que la propaga llega en el packet del formulario:
   * declararla obligatoria aqui obligaria a tocar mapper y mocks, y este packet
   * es solo el tipo.
   */
  functional_currency?: ContableCurrency | null;
  status: AsientoStatus;
  lineas: AsientoLinea[];
  total_debe_base: number;
  total_haber_base: number;
  created_at: string;
  updated_at: string;
}

export interface CreateAsientoPayload {
  periodo_id: string;
  fecha: string;
  descripcion: string;
  /**
   * Opcional a proposito. Omitida, el backend usa la moneda funcional del tenant
   * (`routers/contable/asientos_router.py:258-259`). Mandarla solo tiene sentido
   * para un asiento en moneda distinta, y entonces el backend exige cotizacion
   * oficial del dia o responde `D1_FX_QUOTE`.
   */
  currency?: ContableCurrency;
  exchange_rate: number;
  lineas: AsientoLineaInput[];
}

export interface UpdateAsientoPayload {
  fecha?: string;
  descripcion?: string;
  currency?: ContableCurrency;
  exchange_rate?: number;
  lineas?: AsientoLineaInput[];
}

export interface LibroMayorMovimiento {
  id: string;
  asiento_id: string;
  numero_asiento?: string;
  fecha: string;
  descripcion: string;
  debe_base: number;
  haber_base: number;
  saldo_acumulado: number;
}

export interface LibroMayorReport {
  cuenta_id: string;
  cuenta_codigo: string;
  cuenta_nombre: string;
  periodo_id: string;
  saldo_inicial: number;
  movimientos: LibroMayorMovimiento[];
  saldo_final: number;
}

export interface BalanceComprobacionRow {
  cuenta_id: string;
  codigo: string;
  nombre: string;
  tipo_cuenta: TipoCuenta;
  total_debe: number;
  total_haber: number;
  saldo: number;
}

export interface BalanceComprobacionReport {
  periodo_id: string;
  fiscal_year: number;
  label: string;
  rows: BalanceComprobacionRow[];
  totals: {
    total_debe: number;
    total_haber: number;
    cuadra: boolean;
  };
}

export interface ReopenPeriodoBody {
  justification: string;
  actor_id?: string;
}

// ── Estado de Resultados ───────────────────────────────────────────────────

export interface EstadoResultadosRow {
  codigo: string;
  nombre: string;
  total: number;
}

export interface EstadoResultadosReport {
  desde: string;
  hasta: string;
  project_id?: string;
  ingresos: EstadoResultadosRow[];
  total_ingresos: number;
  costos: EstadoResultadosRow[];
  total_costos: number;
  utilidad_bruta: number;
  gastos: EstadoResultadosRow[];
  total_gastos: number;
  utilidad_neta: number;
  margen_bruto_pct: number;
  margen_neto_pct: number;
}

// ── Situación Financiera ───────────────────────────────────────────────────

export interface SituacionFinancieraDetalle {
  codigo: string;
  nombre: string;
  saldo: number;
  tipo?: string;
}

export interface SituacionFinancieraReport {
  fecha: string;
  activos: {
    total: number;
    corriente: number;
    no_corriente: number;
    detalle: SituacionFinancieraDetalle[];
  };
  pasivos: {
    total: number;
    corriente: number;
    no_corriente: number;
    detalle: SituacionFinancieraDetalle[];
  };
  patrimonio: {
    total: number;
    detalle: { codigo: string; nombre: string; saldo: number }[];
  };
  ecuacion_cuadra: boolean;
}

// ── Monitoreo de gastos ────────────────────────────────────────────────────

export interface GastoMonitor {
  cuenta_id: string;
  codigo: string;
  nombre: string;
  periodo_actual: number;
  periodo_anterior: number;
  variacion_pct: number;
  tendencia: "up" | "down" | "stable";
  alerta: boolean;
}

export interface GastosMonitorReport {
  periodo_id: string;
  periodo_nombre: string;
  gastos: GastoMonitor[];
  total_gastos: number;
  variacion_total_pct: number;
  alertas_count: number;
}

// ── Sugerencias del Agente IA ──────────────────────────────────────────────

export interface SugerenciaFinanciera {
  id: string;
  tipo: "reduccion_gasto" | "aumento_ingreso" | "optimizacion" | "alerta";
  prioridad: "alta" | "media" | "baja";
  titulo: string;
  descripcion: string;
  impacto_estimado_dop?: number;
  cuenta_relacionada?: string;
  accion_sugerida: string;
  generada_en: string;
}

export interface AgenteSugerenciasResponse {
  tenant_id: string;
  generado_en: string;
  periodo_analizado: string;
  sugerencias: SugerenciaFinanciera[];
  resumen_ejecutivo: string;
  score_salud_financiera: number;
}

// ── Auxiliares CxP / CxC ──────────────────────────────────────────────────

export interface AuxiliarEntry {
  id: string;
  fecha: string;
  descripcion: string;
  debe: number;
  haber: number;
  saldo: number;
  referencia?: string;
}

export const CONTABLE_TOLERANCE = 0.01;

export function calcLineaBase(
  monto: number,
  exchangeRate: number,
): number {
  return Math.round(monto * exchangeRate * 100) / 100;
}

export function sumAsientoSides(
  lineas: Pick<AsientoLineaInput, "debe_original" | "haber_original">[],
  exchangeRate: number,
): { totalDebe: number; totalHaber: number; cuadra: boolean } {
  let totalDebe = 0;
  let totalHaber = 0;
  for (const l of lineas) {
    totalDebe += calcLineaBase(l.debe_original || 0, exchangeRate);
    totalHaber += calcLineaBase(l.haber_original || 0, exchangeRate);
  }
  totalDebe = Math.round(totalDebe * 100) / 100;
  totalHaber = Math.round(totalHaber * 100) / 100;
  return {
    totalDebe,
    totalHaber,
    cuadra: Math.abs(totalDebe - totalHaber) <= CONTABLE_TOLERANCE && totalDebe > 0,
  };
}
