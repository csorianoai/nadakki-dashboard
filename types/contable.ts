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

export type ContableCurrency = "DOP" | "USD";

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
  currency: ContableCurrency;
  exchange_rate: number;
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
  currency: ContableCurrency;
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
