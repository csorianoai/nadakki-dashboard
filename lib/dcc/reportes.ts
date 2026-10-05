/**
 * Catalogo de ReportDefinitions del Centro de Reportes v2.
 *
 * Es el inventario FIRMADO de N7 (docs/decisions/N6_N7_METRIC_REGISTRY_Y_REPORTES.md,
 * seccion N7, en nadakki-ai-suite): metadatos, no datos. El backend no expone
 * todavia un registro de ReportDefinitions; cuando exista, este catalogo se
 * reemplaza por su respuesta. Ninguna cifra sale de aqui.
 */

import { accessApiErrorFromHttp } from "@/lib/access/client";
import { apiFetch } from "@/lib/api/fetch-client";

export type Naturaleza = "LIVE" | "SNAPSHOT";

export type ReportDefinition = {
  key: string;
  titulo: string;
  grupo: "Contabilidad" | "Ejecutivo";
  naturaleza: Naturaleza;
  endpoint: string;
  /** Lo que N7 declara pendiente para certificarlo (tooltip). */
  pendiente: string;
  /** El backend devuelve cifra y desglose en la misma respuesta. */
  explicable: boolean;
  /** Pais (ISO 3166-1) cuya autoridad define el reporte; null = de cualquier pais. */
  jurisdiccion: string | null;
  /** Pantalla existente que muestra ESTE reporte con ESTE endpoint; null = no hay. */
  pantalla: string | null;
};

export const CAPABILITY_REPORTES_CONTABLES = "accounting.reports.financial";

/**
 * Pais del tenant desde el branding (`country_code`). OJO: el schema del backend
 * lo rellena con "DO" si falta (schemas/tenant_branding.py:92 en nadakki-ai-suite)
 * y la entidad legal no expone pais; es un hueco declarado. Sin pais: null.
 */
export function paisDelTenant(branding: unknown): string | null {
  const rec = branding && typeof branding === "object" ? (branding as Record<string, unknown>) : {};
  const v = typeof rec.country_code === "string" ? rec.country_code.trim().toUpperCase() : "";
  return /^[A-Z]{2}$/.test(v) ? v : null;
}

/**
 * Reportes que aplican al tenant: los de jurisdiccion solo si coincide con su
 * pais. Sin pais conocido, los de jurisdiccion se ocultan (cerrado ante la duda).
 */
export function reportesDelPais(defs: ReportDefinition[], pais: string | null): ReportDefinition[] {
  return defs.filter((r) => r.jurisdiccion === null || (pais !== null && r.jurisdiccion === pais));
}

export const REPORT_DEFINITIONS: ReportDefinition[] = [
  { key: "trial_balance@1.0", titulo: "Balance de Comprobación", grupo: "Contabilidad", naturaleza: "LIVE", endpoint: "GET /api/v1/contable/balance-comprobacion", pendiente: "Sin snapshot de cierre; moneda no declarada en la respuesta", explicable: true, jurisdiccion: null, pantalla: "/contable/balance-comprobacion" },
  { key: "general_ledger@1.0", titulo: "Libro Mayor", grupo: "Contabilidad", naturaleza: "LIVE", endpoint: "GET /api/v1/contable/mayor", pendiente: "El saldo ignora la naturaleza de la cuenta; sin snapshot", explicable: false, jurisdiccion: null, pantalla: "/contable/libro-mayor" },
  { key: "income_statement@1.0", titulo: "Estado de Resultados", grupo: "Contabilidad", naturaleza: "LIVE", endpoint: "GET /api/v1/contable/reports/estado-resultados", pendiente: "Sin snapshot; moneda no declarada en la respuesta", explicable: false, jurisdiccion: null, pantalla: "/contable/estado-resultados" },
  { key: "balance_sheet@1.0", titulo: "Balance General", grupo: "Contabilidad", naturaleza: "LIVE", endpoint: "GET /api/v1/contable/reports/balance-general", pendiente: "No acepta fecha ni período de corte", explicable: false, jurisdiccion: null, pantalla: null },
  { key: "cash_flow@1.0", titulo: "Flujo de Caja", grupo: "Contabilidad", naturaleza: "LIVE", endpoint: "GET /api/v1/contable/reports/flujo-caja", pendiente: "Cuentas de efectivo fijas en código", explicable: false, jurisdiccion: null, pantalla: null },
  { key: "budget_vs_actual@1.0", titulo: "Presupuesto vs Real", grupo: "Contabilidad", naturaleza: "LIVE", endpoint: "GET /api/v1/contable/reports/presupuesto-vs-real", pendiente: "No hay ruta que escriba presupuestos; reales sin período", explicable: false, jurisdiccion: null, pantalla: null },
  { key: "journal@1.0", titulo: "Libro Diario", grupo: "Contabilidad", naturaleza: "LIVE", endpoint: "GET /api/v1/contable/reports/libro-diario", pendiente: "Solo cabeceras, sin líneas", explicable: false, jurisdiccion: null, pantalla: null },
  { key: "dgii_606@1.0", titulo: "Registro de compras 606 (RD)", grupo: "Contabilidad", naturaleza: "SNAPSHOT", endpoint: "GET /api/v1/contable/fiscal/dgii/606", pendiente: "Sin conciliación contra asientos; solo entidades RD", explicable: false, jurisdiccion: "DO", pantalla: null },
  { key: "dgii_607@1.0", titulo: "Registro de ventas 607 (RD)", grupo: "Contabilidad", naturaleza: "SNAPSHOT", endpoint: "GET /api/v1/contable/fiscal/dgii/607", pendiente: "Sin conciliación contra ventas ni asientos; solo entidades RD", explicable: false, jurisdiccion: "DO", pantalla: null },
  { key: "executive_report@1.0", titulo: "Reporte Ejecutivo", grupo: "Ejecutivo", naturaleza: "LIVE", endpoint: "GET /api/v1/reports/executive", pendiente: "KPIs de pipeline de marketing y agentes, no financieros ni de dealer", explicable: false, jurisdiccion: null, pantalla: null },
];

export type CuentaBalance = { codigo: string; nombre: string; debe: number | null; haber: number | null };
export type BalanceComprobacion = { totalDebe: number; totalHaber: number; cuadra: boolean | null; cuentas: CuentaBalance[] };

function numero(valor: unknown): number | null {
  if (typeof valor === "number" && Number.isFinite(valor)) return valor;
  if (typeof valor === "string" && valor.trim() && Number.isFinite(Number(valor))) return Number(valor);
  return null;
}

function texto(valor: unknown): string {
  return typeof valor === "string" ? valor : valor == null ? "" : String(valor);
}

/**
 * trial_balance@1.0 sin periodo (todos los periodos). Los totales y `cuadra`
 * son los del backend; las cuentas son su desglose. Aqui no se suma nada.
 */
export async function fetchBalanceComprobacion(): Promise<BalanceComprobacion> {
  const path = "/api/v1/contable/balance-comprobacion";
  const response = await apiFetch(path, { headers: { Accept: "application/json" } });
  let body: unknown = null;
  try {
    body = await response.json();
  } catch {
    body = null;
  }
  if (!response.ok) throw accessApiErrorFromHttp(response.status, body, path);
  const rec = body && typeof body === "object" ? (body as Record<string, unknown>) : {};
  const totalDebe = numero(rec.total_debe);
  const totalHaber = numero(rec.total_haber);
  if (totalDebe === null || totalHaber === null || !Array.isArray(rec.cuentas)) {
    throw new Error("DCC_BALANCE_FORMA_INVALIDA");
  }
  return {
    totalDebe,
    totalHaber,
    cuadra: typeof rec.cuadra === "boolean" ? rec.cuadra : null,
    cuentas: rec.cuentas.map((fila) => {
      const f = fila && typeof fila === "object" ? (fila as Record<string, unknown>) : {};
      return { codigo: texto(f.codigo), nombre: texto(f.nombre), debe: numero(f.total_debe), haber: numero(f.total_haber) };
    }),
  };
}
