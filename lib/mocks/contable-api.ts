/**
 * In-memory mock API for Contable 3.1 — replace with real fetch when Stream B ships.
 */

import { cloneContableSeed } from "@/lib/mocks/contable";
import {
  calcLineaBase,
  sumAsientoSides,
  type AsientoContable,
  type AsientoLinea,
  type AsientoLineaInput,
  type BalanceComprobacionReport,
  type CreateAsientoPayload,
  type CreateCuentaPayload,
  type CuentaContable,
  type LibroMayorReport,
  type PeriodoContable,
  type PlanCuentasFilters,
  type ReopenPeriodoBody,
  type UpdateAsientoPayload,
  type UpdateCuentaPayload,
} from "@/types/contable";

const stores = new Map<string, ReturnType<typeof cloneContableSeed>>();

function getStore(tenantId: string) {
  if (!stores.has(tenantId)) stores.set(tenantId, cloneContableSeed(tenantId));
  return stores.get(tenantId)!;
}

function delay<T>(value: T, ms = 80): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

function now() {
  return new Date().toISOString();
}

function uuid() {
  return crypto.randomUUID();
}

function enrichLineas(
  lineas: AsientoLineaInput[],
  cuentas: CuentaContable[],
  exchangeRate: number,
): AsientoLinea[] {
  return lineas.map((l) => {
    const c = cuentas.find((x) => x.id === l.cuenta_id);
    return {
      ...l,
      id: l.id ?? uuid(),
      cuenta_codigo: c?.codigo,
      cuenta_nombre: c?.nombre,
      debe_base: calcLineaBase(l.debe_original || 0, exchangeRate),
      haber_base: calcLineaBase(l.haber_original || 0, exchangeRate),
    };
  });
}

export async function mockListCuentas(
  tenantId: string,
  filters?: PlanCuentasFilters,
): Promise<CuentaContable[]> {
  const store = getStore(tenantId);
  let rows = [...store.cuentas];
  if (filters?.tipo_cuenta) rows = rows.filter((c) => c.tipo_cuenta === filters.tipo_cuenta);
  if (filters?.activa != null) rows = rows.filter((c) => c.activa === filters.activa);
  if (filters?.search?.trim()) {
    const q = filters.search.trim().toLowerCase();
    rows = rows.filter(
      (c) => c.codigo.toLowerCase().includes(q) || c.nombre.toLowerCase().includes(q),
    );
  }
  return delay(rows.sort((a, b) => a.codigo.localeCompare(b.codigo)));
}

export async function mockCreateCuenta(
  tenantId: string,
  payload: CreateCuentaPayload,
): Promise<CuentaContable> {
  const store = getStore(tenantId);
  const parent = payload.cuenta_padre_id
    ? store.cuentas.find((c) => c.id === payload.cuenta_padre_id)
    : undefined;
  const row: CuentaContable = {
    id: uuid(),
    tenant_id: tenantId,
    codigo: payload.codigo,
    nombre: payload.nombre,
    tipo_cuenta: payload.tipo_cuenta,
    naturaleza: payload.naturaleza,
    cuenta_padre_id: payload.cuenta_padre_id ?? null,
    nivel: parent ? parent.nivel + 1 : 1,
    activa: payload.activa ?? true,
    created_at: now(),
    updated_at: now(),
  };
  store.cuentas.push(row);
  return delay(row);
}

export async function mockUpdateCuenta(
  tenantId: string,
  cuentaId: string,
  payload: UpdateCuentaPayload,
): Promise<CuentaContable> {
  const store = getStore(tenantId);
  const idx = store.cuentas.findIndex((c) => c.id === cuentaId);
  if (idx < 0) throw new Error("Cuenta no encontrada");
  store.cuentas[idx] = {
    ...store.cuentas[idx]!,
    ...payload,
    updated_at: now(),
  };
  return delay(store.cuentas[idx]!);
}

export async function mockListPeriodos(
  tenantId: string,
  fiscalYear?: number,
): Promise<PeriodoContable[]> {
  const store = getStore(tenantId);
  let rows = [...store.periodos];
  if (fiscalYear) rows = rows.filter((p) => p.fiscal_year === fiscalYear);
  return delay(rows.sort((a, b) => a.period_number - b.period_number));
}

export async function mockLockPeriodo(
  tenantId: string,
  periodoId: string,
): Promise<PeriodoContable> {
  const store = getStore(tenantId);
  const p = store.periodos.find((x) => x.id === periodoId);
  if (!p) throw new Error("Periodo no encontrado");
  if (p.status === "locked") throw new Error("Periodo ya está locked");
  p.status = p.status === "open" ? "soft_closed" : "locked";
  return delay({ ...p });
}

export async function mockReopenPeriodo(
  tenantId: string,
  periodoId: string,
  _body: ReopenPeriodoBody,
): Promise<PeriodoContable> {
  const store = getStore(tenantId);
  const p = store.periodos.find((x) => x.id === periodoId);
  if (!p) throw new Error("Periodo no encontrado");
  if (p.status === "locked") throw new Error("Periodo locked — no se puede reabrir");
  if (p.status === "open") throw new Error("Periodo ya está abierto");
  p.status = "open";
  return delay({ ...p });
}

export async function mockCreateAsiento(
  tenantId: string,
  payload: CreateAsientoPayload,
): Promise<AsientoContable> {
  const store = getStore(tenantId);
  const periodo = store.periodos.find((p) => p.id === payload.periodo_id);
  if (!periodo) throw new Error("Periodo no encontrado");
  if (periodo.status === "locked") {
    const err = new Error("Periodo locked — no se pueden crear asientos");
    (err as Error & { status: number }).status = 409;
    throw err;
  }
  const lineas = enrichLineas(payload.lineas, store.cuentas, payload.exchange_rate);
  const { totalDebe, totalHaber } = sumAsientoSides(payload.lineas, payload.exchange_rate);
  const row: AsientoContable = {
    id: uuid(),
    tenant_id: tenantId,
    periodo_id: payload.periodo_id,
    numero_asiento: `AST-${Date.now()}`,
    fecha: payload.fecha,
    descripcion: payload.descripcion,
    currency: payload.currency,
    exchange_rate: payload.exchange_rate,
    status: "draft",
    lineas,
    total_debe_base: totalDebe,
    total_haber_base: totalHaber,
    created_at: now(),
    updated_at: now(),
  };
  store.asientos.push(row);
  return delay(row);
}

export async function mockUpdateAsiento(
  tenantId: string,
  asientoId: string,
  payload: UpdateAsientoPayload,
): Promise<AsientoContable> {
  const store = getStore(tenantId);
  const idx = store.asientos.findIndex((a) => a.id === asientoId);
  if (idx < 0) throw new Error("Asiento no encontrado");
  const current = store.asientos[idx]!;
  if (current.status !== "draft") throw new Error("Solo borradores son editables");
  const exchangeRate = payload.exchange_rate ?? current.exchange_rate;
  const lineas = payload.lineas
    ? enrichLineas(payload.lineas, store.cuentas, exchangeRate)
    : current.lineas;
  const sides = sumAsientoSides(
    lineas.map((l) => ({ debe_original: l.debe_base / exchangeRate, haber_original: l.haber_base / exchangeRate })),
    exchangeRate,
  );
  store.asientos[idx] = {
    ...current,
    fecha: payload.fecha ?? current.fecha,
    descripcion: payload.descripcion ?? current.descripcion,
    currency: payload.currency ?? current.currency,
    exchange_rate: exchangeRate,
    lineas,
    total_debe_base: sides.totalDebe,
    total_haber_base: sides.totalHaber,
    updated_at: now(),
  };
  return delay(store.asientos[idx]!);
}

export async function mockPostAsiento(tenantId: string, asientoId: string): Promise<AsientoContable> {
  const store = getStore(tenantId);
  const idx = store.asientos.findIndex((a) => a.id === asientoId);
  if (idx < 0) throw new Error("Asiento no encontrado");
  const current = store.asientos[idx]!;
  if (current.status !== "draft") throw new Error("Asiento ya posteado");
  const periodo = store.periodos.find((p) => p.id === current.periodo_id);
  if (periodo?.status === "locked") {
    const err = new Error("Periodo locked — no se puede postear");
    (err as Error & { status: number }).status = 409;
    throw err;
  }
  const { cuadra, totalDebe, totalHaber } = sumAsientoSides(
    current.lineas.map((l) => ({
      debe_original: l.debe_base / current.exchange_rate,
      haber_original: l.haber_base / current.exchange_rate,
    })),
    current.exchange_rate,
  );
  if (!cuadra) {
    const err = new Error(`Asiento desbalanceado: debe=${totalDebe} haber=${totalHaber}`);
    (err as Error & { status: number }).status = 422;
    throw err;
  }
  store.asientos[idx] = { ...current, status: "posted", updated_at: now() };
  return delay(store.asientos[idx]!);
}

export async function mockGetLibroMayor(
  tenantId: string,
  cuentaId: string,
  periodoId: string,
): Promise<LibroMayorReport> {
  const store = getStore(tenantId);
  const cuenta = store.cuentas.find((c) => c.id === cuentaId);
  if (!cuenta) throw new Error("Cuenta no encontrada");
  const posted = store.asientos.filter(
    (a) => a.periodo_id === periodoId && a.status === "posted",
  );
  let saldo = 0;
  const movimientos = posted.flatMap((a) =>
    a.lineas
      .filter((l) => l.cuenta_id === cuentaId)
      .map((l) => {
        saldo += l.debe_base - l.haber_base;
        return {
          id: l.id ?? uuid(),
          asiento_id: a.id,
          numero_asiento: a.numero_asiento,
          fecha: a.fecha,
          descripcion: l.descripcion || a.descripcion,
          debe_base: l.debe_base,
          haber_base: l.haber_base,
          saldo_acumulado: Math.round(saldo * 100) / 100,
        };
      }),
  );
  return delay({
    cuenta_id: cuentaId,
    cuenta_codigo: cuenta.codigo,
    cuenta_nombre: cuenta.nombre,
    periodo_id: periodoId,
    saldo_inicial: 0,
    movimientos,
    saldo_final: Math.round(saldo * 100) / 100,
  });
}

export async function mockGetBalanceComprobacion(
  tenantId: string,
  periodoId: string,
): Promise<BalanceComprobacionReport> {
  const store = getStore(tenantId);
  const periodo = store.periodos.find((p) => p.id === periodoId);
  const posted = store.asientos.filter(
    (a) => a.periodo_id === periodoId && a.status === "posted",
  );
  const totalsByCuenta = new Map<string, { debe: number; haber: number }>();
  for (const a of posted) {
    for (const l of a.lineas) {
      const t = totalsByCuenta.get(l.cuenta_id) ?? { debe: 0, haber: 0 };
      t.debe += l.debe_base;
      t.haber += l.haber_base;
      totalsByCuenta.set(l.cuenta_id, t);
    }
  }
  const rows = store.cuentas
    .filter((c) => totalsByCuenta.has(c.id))
    .map((c) => {
      const t = totalsByCuenta.get(c.id)!;
      const totalDebe = Math.round(t.debe * 100) / 100;
      const totalHaber = Math.round(t.haber * 100) / 100;
      return {
        cuenta_id: c.id,
        codigo: c.codigo,
        nombre: c.nombre,
        tipo_cuenta: c.tipo_cuenta,
        total_debe: totalDebe,
        total_haber: totalHaber,
        saldo: Math.round((totalDebe - totalHaber) * 100) / 100,
      };
    })
    .sort((a, b) => a.codigo.localeCompare(b.codigo));
  const totalDebe = Math.round(rows.reduce((s, r) => s + r.total_debe, 0) * 100) / 100;
  const totalHaber = Math.round(rows.reduce((s, r) => s + r.total_haber, 0) * 100) / 100;
  return delay({
    periodo_id: periodoId,
    fiscal_year: periodo?.fiscal_year ?? new Date().getFullYear(),
    label: periodo?.label ?? periodoId,
    rows,
    totals: {
      total_debe: totalDebe,
      total_haber: totalHaber,
      cuadra: Math.abs(totalDebe - totalHaber) <= 0.01,
    },
  });
}

export async function mockListAsientos(
  tenantId: string,
  periodoId?: string,
): Promise<AsientoContable[]> {
  const store = getStore(tenantId);
  let rows = [...store.asientos];
  if (periodoId) rows = rows.filter((a) => a.periodo_id === periodoId);
  return delay(rows.sort((a, b) => b.created_at.localeCompare(a.created_at)));
}
