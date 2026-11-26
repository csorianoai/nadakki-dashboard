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
  cuentaId: string,
  periodoId: string,
): Promise<LibroMayorReport> {
  if (USE_MOCKS) return mock.mockGetLibroMayor(tenantId, cuentaId, periodoId);

  const raw = await contableFetch<Record<string, unknown>[]>(tenantId,
    `/mayor?cuenta_id=${encodeURIComponent(cuentaId)}&periodo_id=${encodeURIComponent(periodoId)}`);
  const rows = Array.isArray(raw) ? raw.filter((r) => r.cuenta_id === cuentaId && r.periodo_id === periodoId) : [];
  const sum = (field: string) => rows.reduce((total, r) => total + reportNumber(r[field]), 0);
  const saldo = sum("saldo");
  return {
    cuenta_id: cuentaId, cuenta_codigo: String(rows[0]?.codigo ?? ""), cuenta_nombre: String(rows[0]?.nombre ?? ""),
    periodo_id: periodoId, saldo_inicial: Number.NaN, saldo_final: saldo,
    movimientos: rows.length ? [{ id: `total-${cuentaId}-${periodoId}`, asiento_id: "", fecha: "",
      descripcion: "Total del período", debe_base: sum("total_debe"), haber_base: sum("total_haber"), saldo_acumulado: saldo }] : [],
  };
}

export async function getBalanceComprobacion(
  tenantId: string,
  periodoId: string,
): Promise<BalanceComprobacionReport> {
  if (USE_MOCKS) return mock.mockGetBalanceComprobacion(tenantId, periodoId);

  const [raw, periods] = await Promise.all([
    contableFetch<Record<string, unknown>>(tenantId, `/balance-comprobacion?periodo_id=${encodeURIComponent(periodoId)}`),
    listPeriodos(tenantId),
  ]);
  const period = periods.find((p) => p.id === periodoId);
  // The router does not include account type. Resolve it from the real chart of accounts.
  const cuentas = await listCuentas(tenantId);
  return {
    periodo_id: periodoId, fiscal_year: period?.fiscal_year ?? Number.NaN, label: period?.label ?? "",
    rows: (Array.isArray(raw.cuentas) ? raw.cuentas : []).map((r) => ({
      cuenta_id: String(r.cuenta_id ?? ""), codigo: String(r.codigo ?? ""), nombre: String(r.nombre ?? ""),
      tipo_cuenta: cuentas.find((c) => c.id === r.cuenta_id)?.tipo_cuenta,
      total_debe: reportNumber(r.total_debe), total_haber: reportNumber(r.total_haber), saldo: reportNumber(r.saldo),
    })),
    totals: { total_debe: reportNumber(raw.total_debe), total_haber: reportNumber(raw.total_haber), cuadra: raw.cuadra === true },
  };
}

// ── Reportes financieros ──────────────────────────────────────────────────

export async function getEstadoResultados(
  tenantId: string,
  desde: string,
  hasta: string,
  projectId?: string,
): Promise<EstadoResultadosReport> {
  if (projectId) throw new ContableApiError("El backend no permite filtrar este reporte por proyecto.", 422);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(desde) || !/^\d{4}-\d{2}-\d{2}$/.test(hasta) || desde > hasta) {
    throw new ContableApiError("Indica un rango de fechas válido.", 422);
  }
  const periods = (await listPeriodos(tenantId)).filter((p) => p.fecha_inicio <= hasta && p.fecha_fin >= desde);
  const responses = await Promise.all(periods.map((p) => contableFetch<Record<string, unknown>[]>(tenantId,
    `/reports/estado-resultados?periodo_id=${encodeURIComponent(p.id)}`)));
  const groups = { ingresos: new Map<string, { codigo: string; nombre: string; total: number }>(),
    costos: new Map<string, { codigo: string; nombre: string; total: number }>(),
    gastos: new Map<string, { codigo: string; nombre: string; total: number }>() };
  for (const rows of responses) {
    if (!Array.isArray(rows)) throw new ContableApiError("Respuesta inválida del estado de resultados.", 502);
    for (const row of rows) {
      if (row.tipo_cuenta !== "ingreso" && row.tipo_cuenta !== "gasto") continue;
      const codigo = String(row.codigo ?? "");
      const target = row.tipo_cuenta === "ingreso" ? groups.ingresos : codigo.startsWith("50") ? groups.costos : groups.gastos;
      const previous = target.get(codigo);
      target.set(codigo, { codigo, nombre: String(row.nombre ?? ""), total: (previous?.total ?? 0) + reportNumber(row.saldo) });
    }
  }
  const ingresos = [...groups.ingresos.values()], costos = [...groups.costos.values()], gastos = [...groups.gastos.values()];
  const sum = (rows: typeof ingresos) => rows.reduce((total, row) => total + row.total, 0);
  const total_ingresos = sum(ingresos), total_costos = sum(costos), total_gastos = sum(gastos);
  const utilidad_bruta = total_ingresos - total_costos, utilidad_neta = utilidad_bruta - total_gastos;
  return { desde, hasta, ingresos, costos, gastos, total_ingresos, total_costos, total_gastos, utilidad_bruta, utilidad_neta,
    margen_bruto_pct: total_ingresos === 0 ? 0 : utilidad_bruta / total_ingresos * 100,
    margen_neto_pct: total_ingresos === 0 ? 0 : utilidad_neta / total_ingresos * 100 };
}

/** Unknown/missing amounts remain unknown, so the UI renders an em dash instead of a fabricated zero. */
function reportNumber(value: unknown): number {
  return (typeof value === "number" || (typeof value === "string" && value.trim() !== "")) && Number.isFinite(Number(value))
    ? Number(value) : Number.NaN;
}

export async function getSituacionFinanciera(tenantId: string, fecha: string): Promise<SituacionFinancieraReport> {
  // balance-general is a current snapshot: it has no historical date filter or current/non-current breakdown.
  if (fecha !== new Date().toISOString().slice(0, 10)) {
    throw new ContableApiError("El backend solo ofrece el balance general actual; no permite consultar una fecha histórica.", 422);
  }
  const raw = await contableFetch<Record<string, unknown>[]>(tenantId, "/reports/balance-general");
  if (!Array.isArray(raw)) throw new ContableApiError("Respuesta inválida del balance general.", 502);
  const group = (type: string) => {
    const detalle = raw.filter((r) => r.tipo_cuenta === type).map((r) => ({ codigo: String(r.codigo ?? ""), nombre: String(r.nombre ?? ""), saldo: reportNumber(r.saldo) }));
    return { total: detalle.reduce((total, r) => total + r.saldo, 0), corriente: Number.NaN, no_corriente: Number.NaN, detalle };
  };
  const activos = group("activo"), pasivos = group("pasivo"), patrimonio = group("patrimonio");
  // Validacion Cowork 26-nov: sin asiento de cierre, la utilidad del ejercicio sigue en ingresos y gastos y la
  // ecuacion "no cuadraba" por exactamente ese monto. Se muestra como linea de patrimonio, sin escribir nada.
  const resultados = await contableFetch<Record<string, unknown>[]>(tenantId, "/reports/estado-resultados");
  if (!Array.isArray(resultados)) throw new ContableApiError("Respuesta inválida del estado de resultados.", 502);
  const resultado = Math.round(resultados.reduce(
    (total, r) => total + (r.tipo_cuenta === "ingreso" ? reportNumber(r.saldo) : r.tipo_cuenta === "gasto" ? -reportNumber(r.saldo) : 0), 0) * 100) / 100;
  if (Math.abs(resultado) >= 0.005) {
    patrimonio.detalle.push({ codigo: "", nombre: "Resultado del ejercicio (sin cerrar)", saldo: resultado });
    patrimonio.total += resultado;
  }
  return { fecha, activos, pasivos, patrimonio, ecuacion_cuadra: Math.abs(activos.total - pasivos.total - patrimonio.total) < 0.02 };
}

export async function getGastosMonitor(tenantId: string, periodoId: string): Promise<GastosMonitorReport> {
  // There is no gastos-monitor route. Compare real income-statement expense rows for consecutive periods.
  const periods = (await listPeriodos(tenantId)).sort((a, b) => a.fecha_inicio.localeCompare(b.fecha_inicio));
  const period = periods.find((p) => p.id === periodoId);
  if (!period) throw new ContableApiError("Período contable no encontrado.", 404);
  const previous = periods.filter((p) => p.fecha_fin < period.fecha_inicio).at(-1);
  const read = (id: string) => contableFetch<Record<string, unknown>[]>(tenantId, `/reports/estado-resultados?periodo_id=${encodeURIComponent(id)}`);
  const [currentRows, previousRows, accounts] = await Promise.all([read(period.id), previous ? read(previous.id) : Promise.resolve([]), listCuentas(tenantId)]);
  if (!Array.isArray(currentRows) || !Array.isArray(previousRows)) throw new ContableApiError("Respuesta inválida del reporte de gastos.", 502);
  const expenseRows = (rows: typeof currentRows) => rows.filter((r) => r.tipo_cuenta === "gasto" && !String(r.codigo).startsWith("50"));
  const current = expenseRows(currentRows), prior = expenseRows(previousRows);
  const codes = [...new Set([...current, ...prior].map((r) => String(r.codigo)))];
  const variation = (actual: number, anterior: number) => anterior !== 0 ? (actual - anterior) / Math.abs(anterior) * 100 : actual === 0 ? 0 : Number.NaN;
  const gastos = codes.map((codigo) => {
    const row = current.find((r) => String(r.codigo) === codigo), old = prior.find((r) => String(r.codigo) === codigo);
    const actual = row ? reportNumber(row.saldo) : 0, anterior = previous ? old ? reportNumber(old.saldo) : 0 : Number.NaN;
    return { cuenta_id: accounts.find((a) => a.codigo === codigo)?.id ?? "", codigo, nombre: String(row?.nombre ?? old?.nombre ?? ""),
      periodo_actual: actual, periodo_anterior: anterior, variacion_pct: variation(actual, anterior),
      tendencia: (actual > anterior ? "up" : actual < anterior ? "down" : "stable") as "up" | "down" | "stable", alerta: false };
  });
  const total_gastos = gastos.reduce((total, g) => total + g.periodo_actual, 0);
  const anterior = gastos.reduce((total, g) => total + g.periodo_anterior, 0);
  return { periodo_id: periodoId, periodo_nombre: period.label, gastos, total_gastos,
    variacion_total_pct: variation(total_gastos, anterior), alertas_count: Number.NaN };
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
