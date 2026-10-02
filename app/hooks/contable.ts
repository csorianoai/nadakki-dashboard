/**
 * Contable 3.1 hooks — /api/v1/contable/* (Stream B).
 * Defaults to typed mocks until NEXT_PUBLIC_CONTABLE_USE_MOCKS=false in prod.
 */

import { getAuthHeaders, resolveApiUrl } from "@/lib/api/fetch-client";
import * as mock from "@/lib/mocks/contable-api";
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
  return {
    id: String(row.id),
    tenant_id: String(row.tenant_id),
    fiscal_year: Number(row.fiscal_year),
    period_number: Number(row.period_number),
    label: String(row.label ?? ""),
    status: String(row.status ?? "open") as PeriodoContable["status"],
    fecha_inicio: String(row.fecha_inicio ?? "").slice(0, 10),
    fecha_fin: String(row.fecha_fin ?? "").slice(0, 10),
  };
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

  return contableFetch<LibroMayorReport>(
    tenantId,
    `/mayor?cuenta_id=${encodeURIComponent(cuentaId)}&periodo_id=${encodeURIComponent(periodoId)}`,
  );
}

export async function getBalanceComprobacion(
  tenantId: string,
  periodoId: string,
): Promise<BalanceComprobacionReport> {
  if (USE_MOCKS) return mock.mockGetBalanceComprobacion(tenantId, periodoId);

  return contableFetch<BalanceComprobacionReport>(
    tenantId,
    `/balance-comprobacion?periodo_id=${encodeURIComponent(periodoId)}`,
  );
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
