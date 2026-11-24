/**
 * Contable 3.1 hooks — /api/v1/contable/* (Stream B).
 * Defaults to typed mocks until NEXT_PUBLIC_CONTABLE_USE_MOCKS=false in prod.
 */

import { getAuthHeaders, resolveApiUrl } from "@/lib/api/fetch-client";
import * as mock from "@/lib/mocks/contable-api";
import { nombrePeriodo } from "@/lib/contable/periodo-nombre";
import type {
  AgenteSugerenciasResponse,
  AsientoContable,
  AuxiliarEntry,
  BalanceComprobacionReport,
  CreateAsientoPayload,
  CreateCuentaPayload,
  CuentaContable,
  EstadoResultadosReport,
  GastosMonitorReport,
  LibroMayorReport,
  PeriodoContable,
  PlanCuentasFilters,
  ReopenPeriodoBody,
  SituacionFinancieraReport,
  UpdateAsientoPayload,
  UpdateCuentaPayload,
} from "@/types/contable";

export type MayorCuentaRow = {
  tenant_id?: string;
  cuenta_id: string;
  codigo: string;
  nombre: string;
  periodo_id: string;
  total_debe: number;
  total_haber: number;
  saldo: number;
};

export type BalanceComprobacionDashboardReport = {
  periodo_id?: string;
  rows: Array<{
    cuenta_id: string;
    codigo: string;
    nombre: string;
    total_debe: number;
    total_haber: number;
    saldo: number;
  }>;
  totals: { total_debe: number; total_haber: number; cuadra: boolean };
};

export function periodoQueContieneFecha(
  periodos: PeriodoContable[],
  fecha: string,
): PeriodoContable | undefined {
  return periodos.find((periodo) => periodo.fecha_inicio <= fecha && fecha <= periodo.fecha_fin);
}

export function fechaLocalIso(fecha = new Date()): string {
  const year = fecha.getFullYear();
  const month = String(fecha.getMonth() + 1).padStart(2, "0");
  const day = String(fecha.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

const CONTABLE_BASE = resolveApiUrl("/api/v1/contable");

/** TODO[contable-backend]: set to false when Stream B is deployed to prod. */
const USE_MOCKS =
  typeof process !== "undefined" &&
  process.env.NEXT_PUBLIC_CONTABLE_USE_MOCKS !== "false";

export class ContableApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly detail?: unknown,
  ) {
    super(message);
    this.name = "ContableApiError";
  }
}

function extractApiDetail(body: unknown, fallback: string): string {
  if (typeof body === "string" && body.trim()) return body;
  if (body && typeof body === "object") {
    const o = body as Record<string, unknown>;
    if (typeof o.detail === "string") return o.detail;
    if (Array.isArray(o.detail)) {
      return o.detail
        .map((d) =>
          typeof d === "object" && d && "msg" in d
            ? String((d as { msg: string }).msg)
            : JSON.stringify(d),
        )
        .join("; ");
    }
    if (o.error && typeof o.error === "object") {
      const err = o.error as Record<string, unknown>;
      if (typeof err.message === "string") return err.message;
    }
    if (typeof o.message === "string") return o.message;
  }
  return fallback;
}

function mapHttpError(status: number, body: unknown, fallback: string): ContableApiError {
  const detail = extractApiDetail(body, fallback);
  if (status === 400 && /tenant|X-Tenant-ID/i.test(detail)) {
    return new ContableApiError("Sesión expirada, recarga la página", status, body);
  }
  if (status === 404) {
    return new ContableApiError("Recurso contable no encontrado", status, body);
  }
  if (status === 409) {
    return new ContableApiError(detail.includes("locked") ? "Periodo cerrado (locked)" : detail, status, body);
  }
  if (status === 422) {
    return new ContableApiError(
      detail.includes("desbalance") || detail.includes("balance")
        ? "Asiento desbalanceado — debe = haber"
        : detail,
      status,
      body,
    );
  }
  return new ContableApiError(detail, status, body);
}

function contableHeaders(tenantId: string, jsonBody = true): HeadersInit {
  const h: Record<string, string> = {
    Accept: "application/json",
    "X-Tenant-ID": tenantId.trim(),
    ...getAuthHeaders(),
  };
  if (jsonBody) h["Content-Type"] = "application/json";
  return h;
}

async function contableFetch<T>(
  tenantId: string,
  path: string,
  init?: RequestInit,
): Promise<T> {
  const method = (init?.method ?? "GET").toUpperCase();
  const hasBody = init?.body != null && method !== "GET" && method !== "HEAD";
  const url = `${CONTABLE_BASE}${path.startsWith("/") ? path : `/${path}`}`;
  const res = await fetch(url, {
    ...init,
    method,
    headers: contableHeaders(tenantId, hasBody),
    credentials: init?.credentials ?? "include",
  });

  if (res.status === 204) return undefined as T;

  const text = await res.text().catch(() => "");
  let parsed: unknown;
  try {
    parsed = text ? JSON.parse(text) : null;
  } catch {
    parsed = text;
  }

  if (!res.ok) throw mapHttpError(res.status, parsed, res.statusText || "Error de API");
  return parsed as T;
}

function toCuenta(row: Record<string, unknown>): CuentaContable {
  return {
    id: String(row.id),
    tenant_id: String(row.tenant_id),
    codigo: String(row.codigo ?? ""),
    nombre: String(row.nombre ?? ""),
    tipo_cuenta: String(row.tipo_cuenta ?? "activo") as CuentaContable["tipo_cuenta"],
    naturaleza: String(row.naturaleza ?? "deudora") as CuentaContable["naturaleza"],
    cuenta_padre_id: row.cuenta_padre_id ? String(row.cuenta_padre_id) : null,
    nivel: Number(row.nivel ?? 1),
    activa: row.activa !== false,
    created_at: String(row.created_at ?? new Date().toISOString()),
    updated_at: String(row.updated_at ?? new Date().toISOString()),
  };
}

function toPeriodo(row: Record<string, unknown>): PeriodoContable {
  // La tabla trae start_date/end_date y ninguna columna de nombre: se leian
  // fecha_inicio/fecha_fin y label, que no llegan, y el periodo salia en blanco.
  const periodo = {
    id: String(row.id),
    tenant_id: String(row.tenant_id),
    fiscal_year: Number(row.fiscal_year),
    period_number: Number(row.period_number),
    status: String(row.status ?? "open") as PeriodoContable["status"],
    fecha_inicio: String(row.fecha_inicio ?? row.start_date ?? "").slice(0, 10),
    fecha_fin: String(row.fecha_fin ?? row.end_date ?? "").slice(0, 10),
  };
  return { ...periodo, label: nombrePeriodo({ ...periodo, label: typeof row.label === "string" ? row.label : null }) };
}

function toAsiento(row: Record<string, unknown>): AsientoContable {
  const lineas = Array.isArray(row.lineas) ? row.lineas : [];
  return {
    id: String(row.id),
    tenant_id: String(row.tenant_id),
    periodo_id: String(row.periodo_id),
    numero_asiento: row.numero_asiento ? String(row.numero_asiento) : undefined,
    fecha: String(row.fecha ?? "").slice(0, 10),
    descripcion: String(row.descripcion ?? ""),
    // Sin `?? "DOP"`. Un asiento cuya moneda el backend no informa no es un
    // asiento en pesos dominicanos: es un asiento sin moneda conocida, y
    // rellenarlo falseaba la moneda de todo tenant que no fuera de RD.
    currency: typeof row.currency === "string" && row.currency.trim() ? row.currency.trim().toUpperCase() : null,
    exchange_rate: Number(row.exchange_rate ?? 1),
    // El contrato la devuelve (asientos_router.py:296-298) y se tiraba.
    functional_currency:
      typeof row.functional_currency === "string" && row.functional_currency.trim()
        ? row.functional_currency.trim().toUpperCase()
        : null,
    status: String(row.status ?? "draft") as AsientoContable["status"],
    lineas: lineas.map((l) => {
      const x = l as Record<string, unknown>;
      return {
        id: x.id ? String(x.id) : undefined,
        cuenta_id: String(x.cuenta_id),
        cuenta_codigo: x.cuenta_codigo ? String(x.cuenta_codigo) : undefined,
        cuenta_nombre: x.cuenta_nombre ? String(x.cuenta_nombre) : undefined,
        descripcion: x.descripcion ? String(x.descripcion) : undefined,
        debe_original: Number(x.debe_original ?? 0),
        haber_original: Number(x.haber_original ?? 0),
        debe_base: Number(x.debe_base ?? 0),
        haber_base: Number(x.haber_base ?? 0),
      };
    }),
    total_debe_base: Number(row.total_debe_base ?? 0),
    total_haber_base: Number(row.total_haber_base ?? 0),
    created_at: String(row.created_at ?? new Date().toISOString()),
    updated_at: String(row.updated_at ?? new Date().toISOString()),
  };
}

// ── Plan de cuentas ────────────────────────────────────────────────────────

export async function listCuentas(
  tenantId: string,
  filters?: PlanCuentasFilters,
): Promise<CuentaContable[]> {
  if (USE_MOCKS) return mock.mockListCuentas(tenantId, filters);

  const params = new URLSearchParams();
  if (filters?.tipo_cuenta) params.set("tipo_cuenta", filters.tipo_cuenta);
  if (filters?.activa != null) params.set("activa", String(filters.activa));
  if (filters?.search) params.set("search", filters.search);
  const q = params.toString();
  const raw = await contableFetch<Record<string, unknown>[]>(
    tenantId,
    `/plan-cuentas${q ? `?${q}` : ""}`,
  );
  return (Array.isArray(raw) ? raw : []).map(toCuenta);
}

export async function createCuenta(
  tenantId: string,
  payload: CreateCuentaPayload,
): Promise<CuentaContable> {
  if (USE_MOCKS) return mock.mockCreateCuenta(tenantId, payload);

  const row = await contableFetch<Record<string, unknown>>(tenantId, `/plan-cuentas`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return toCuenta(row);
}

export async function updateCuenta(
  tenantId: string,
  cuentaId: string,
  payload: UpdateCuentaPayload,
): Promise<CuentaContable> {
  if (USE_MOCKS) return mock.mockUpdateCuenta(tenantId, cuentaId, payload);

  const row = await contableFetch<Record<string, unknown>>(tenantId, `/plan-cuentas/${cuentaId}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
  return toCuenta(row);
}

// ── Periodos ───────────────────────────────────────────────────────────────

export async function listPeriodos(
  tenantId: string,
  fiscalYear?: number,
): Promise<PeriodoContable[]> {
  if (USE_MOCKS) return mock.mockListPeriodos(tenantId, fiscalYear);

  const q = fiscalYear ? `?fiscal_year=${fiscalYear}` : "";
  const raw = await contableFetch<Record<string, unknown>[]>(tenantId, `/periodos${q}`);
  return (Array.isArray(raw) ? raw : []).map(toPeriodo);
}

export async function lockPeriodo(tenantId: string, periodoId: string): Promise<PeriodoContable> {
  if (USE_MOCKS) return mock.mockLockPeriodo(tenantId, periodoId);

  const row = await contableFetch<Record<string, unknown>>(tenantId, `/periodos/${periodoId}/lock`, {
    method: "POST",
    body: JSON.stringify({ actor_id: "dashboard-user" }),
  });
  return toPeriodo(row);
}

export async function reopenPeriodo(
  tenantId: string,
  periodoId: string,
  body: ReopenPeriodoBody,
): Promise<PeriodoContable> {
  if (USE_MOCKS) return mock.mockReopenPeriodo(tenantId, periodoId, body);

  const row = await contableFetch<Record<string, unknown>>(tenantId, `/periodos/${periodoId}/reopen`, {
    method: "POST",
    body: JSON.stringify({
      actor_id: body.actor_id ?? "dashboard-user",
      justification: body.justification,
    }),
  });
  return toPeriodo(row);
}

// ── Asientos ───────────────────────────────────────────────────────────────

export async function listAsientos(
  tenantId: string,
  periodoId?: string,
): Promise<AsientoContable[]> {
  if (USE_MOCKS) return mock.mockListAsientos(tenantId, periodoId);

  const q = periodoId ? `?periodo_id=${periodoId}` : "";
  const raw = await contableFetch<Record<string, unknown>[]>(tenantId, `/asientos${q}`);
  return (Array.isArray(raw) ? raw : []).map(toAsiento);
}

export async function createAsiento(
  tenantId: string,
  payload: CreateAsientoPayload,
): Promise<AsientoContable> {
  if (USE_MOCKS) return mock.mockCreateAsiento(tenantId, payload);

  const row = await contableFetch<Record<string, unknown>>(tenantId, `/asientos`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return toAsiento(row);
}

export async function updateAsiento(
  tenantId: string,
  asientoId: string,
  payload: UpdateAsientoPayload,
): Promise<AsientoContable> {
  if (USE_MOCKS) return mock.mockUpdateAsiento(tenantId, asientoId, payload);

  const row = await contableFetch<Record<string, unknown>>(tenantId, `/asientos/${asientoId}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
  return toAsiento(row);
}

export async function postAsiento(tenantId: string, asientoId: string): Promise<AsientoContable> {
  if (USE_MOCKS) return mock.mockPostAsiento(tenantId, asientoId);

  const row = await contableFetch<Record<string, unknown>>(tenantId, `/asientos/${asientoId}/post`, {
    method: "POST",
    body: JSON.stringify({ actor_id: "dashboard-user" }),
  });
  return toAsiento(row);
}

// ── Reportes ───────────────────────────────────────────────────────────────

export async function getLibroMayor(
  tenantId: string,
  cuentaId?: string,
  periodoId?: string,
): Promise<MayorCuentaRow[]> {
  if (USE_MOCKS) {
    const [accounts, periods] = await Promise.all([
      mock.mockListCuentas(tenantId, { activa: true }),
      mock.mockListPeriodos(tenantId),
    ]);
    const selectedAccounts = accounts.filter((account) => !cuentaId || account.id === cuentaId);
    const selectedPeriods = periods.filter((period) => !periodoId || period.id === periodoId);
    const rows: MayorCuentaRow[] = [];
    for (const account of selectedAccounts) {
      for (const period of selectedPeriods) {
        const report = await mock.mockGetLibroMayor(tenantId, account.id, period.id);
        rows.push({
          cuenta_id: account.id,
          codigo: account.codigo,
          nombre: account.nombre,
          periodo_id: period.id,
          total_debe: report.movimientos.reduce((sum, movement) => sum + movement.debe_base, 0),
          total_haber: report.movimientos.reduce((sum, movement) => sum + movement.haber_base, 0),
          saldo: report.saldo_final,
        });
      }
    }
    return rows;
  }

  const params = new URLSearchParams();
  if (cuentaId) params.set("cuenta_id", cuentaId);
  if (periodoId) params.set("periodo_id", periodoId);
  const query = params.toString();
  return contableFetch<MayorCuentaRow[]>(tenantId, `/mayor${query ? `?${query}` : ""}`);
}

export async function getBalanceComprobacion(
  tenantId: string,
  periodoId?: string,
): Promise<BalanceComprobacionDashboardReport> {
  if (USE_MOCKS) {
    const periods = await mock.mockListPeriodos(tenantId);
    const selectedPeriods = periods.filter((period) => !periodoId || period.id === periodoId);
    const byAccount = new Map<string, BalanceComprobacionDashboardReport["rows"][number]>();
    for (const period of selectedPeriods) {
      const report = await mock.mockGetBalanceComprobacion(tenantId, period.id);
      for (const row of report.rows) {
        const current = byAccount.get(row.cuenta_id) ?? {
          cuenta_id: row.cuenta_id,
          codigo: row.codigo,
          nombre: row.nombre,
          total_debe: 0,
          total_haber: 0,
          saldo: 0,
        };
        current.total_debe += row.total_debe;
        current.total_haber += row.total_haber;
        current.saldo += row.saldo;
        byAccount.set(row.cuenta_id, current);
      }
    }
    const rows = [...byAccount.values()];
    const totalDebe = rows.reduce((sum, row) => sum + row.total_debe, 0);
    const totalHaber = rows.reduce((sum, row) => sum + row.total_haber, 0);
    return {
      periodo_id: periodoId,
      rows,
      totals: { total_debe: totalDebe, total_haber: totalHaber, cuadra: Math.abs(totalDebe - totalHaber) < 0.02 },
    };
  }

  const params = new URLSearchParams();
  if (periodoId) params.set("periodo_id", periodoId);
  const query = params.toString();
  const response = await contableFetch<{
    cuentas?: BalanceComprobacionDashboardReport["rows"];
    total_debe?: number;
    total_haber?: number;
    cuadra?: boolean;
  }>(
    tenantId,
    `/balance-comprobacion${query ? `?${query}` : ""}`,
  );
  const rows = Array.isArray(response?.cuentas) ? response.cuentas : [];
  const totalDebe = Number(response?.total_debe ?? 0);
  const totalHaber = Number(response?.total_haber ?? 0);
  return {
    periodo_id: periodoId,
    rows,
    totals: {
      total_debe: totalDebe,
      total_haber: totalHaber,
      cuadra: typeof response?.cuadra === "boolean" ? response.cuadra : Math.abs(totalDebe - totalHaber) < 0.02,
    },
  };
}

export async function getEstadoResultadosPorPeriodo(
  tenantId: string,
  periodoId: string,
): Promise<EstadoResultadosReport> {
  const rows = await contableFetch<Array<{
    tipo_cuenta?: string;
    codigo?: string;
    nombre?: string;
    saldo?: number;
  }>>(
    tenantId,
    `/reports/estado-resultados?periodo_id=${encodeURIComponent(periodoId)}`,
  );
  const entries = Array.isArray(rows) ? rows : [];
  const mapRow = (row: (typeof entries)[number]) => ({
    codigo: String(row.codigo ?? ""),
    nombre: String(row.nombre ?? ""),
    total: Number(row.saldo ?? 0),
  });
  const ingresos = entries.filter((row) => row.tipo_cuenta === "ingreso").map(mapRow);
  const gastos = entries.filter((row) => row.tipo_cuenta === "gasto").map(mapRow);
  const totalIngresos = ingresos.reduce((total, row) => total + row.total, 0);
  const totalGastos = gastos.reduce((total, row) => total + row.total, 0);
  const utilidadNeta = totalIngresos - totalGastos;
  return {
    desde: "",
    hasta: "",
    ingresos,
    total_ingresos: totalIngresos,
    costos: [],
    total_costos: 0,
    utilidad_bruta: totalIngresos,
    gastos,
    total_gastos: totalGastos,
    utilidad_neta: utilidadNeta,
    margen_bruto_pct: 0,
    margen_neto_pct: totalIngresos ? (utilidadNeta / totalIngresos) * 100 : 0,
  };
}

// ── Reportes financieros ──────────────────────────────────────────────────

export async function getEstadoResultados(
  tenantId: string,
  desde: string,
  hasta: string,
  projectId?: string,
): Promise<EstadoResultadosReport> {
  const params = new URLSearchParams({ desde, hasta });
  if (projectId) params.set("project_id", projectId);
  return contableFetch<EstadoResultadosReport>(
    tenantId,
    `/reports/estado-resultados?${params}`,
  );
}

export async function getSituacionFinanciera(
  tenantId: string,
  fecha: string,
): Promise<SituacionFinancieraReport> {
  return contableFetch<SituacionFinancieraReport>(
    tenantId,
    `/reports/situacion-financiera?fecha=${encodeURIComponent(fecha)}`,
  );
}

export async function getGastosMonitor(
  tenantId: string,
  periodoId: string,
): Promise<GastosMonitorReport> {
  return contableFetch<GastosMonitorReport>(
    tenantId,
    `/reports/gastos-monitor?periodo_id=${encodeURIComponent(periodoId)}`,
  );
}

export async function getSugerenciasAgente(
  tenantId: string,
  periodoId: string,
): Promise<AgenteSugerenciasResponse> {
  return contableFetch<AgenteSugerenciasResponse>(
    tenantId,
    `/reports/sugerencias-ia`,
    { method: "POST", body: JSON.stringify({ periodo_id: periodoId }) },
  );
}

export async function getAuxiliarCxP(
  tenantId: string,
  vendorId?: string,
  desde?: string,
  hasta?: string,
): Promise<AuxiliarEntry[]> {
  const params = new URLSearchParams();
  if (vendorId) params.set("vendor_id", vendorId);
  if (desde) params.set("desde", desde);
  if (hasta) params.set("hasta", hasta);
  return contableFetch<AuxiliarEntry[]>(
    tenantId,
    `/reports/auxiliar-cxp?${params}`,
  );
}

export async function getAuxiliarCxC(
  tenantId: string,
  customerId?: string,
  desde?: string,
  hasta?: string,
): Promise<AuxiliarEntry[]> {
  const params = new URLSearchParams();
  if (customerId) params.set("customer_id", customerId);
  if (desde) params.set("desde", desde);
  if (hasta) params.set("hasta", hasta);
  return contableFetch<AuxiliarEntry[]>(
    tenantId,
    `/reports/auxiliar-cxc?${params}`,
  );
}
