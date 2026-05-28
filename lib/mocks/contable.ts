import type {
  AsientoContable,
  CuentaContable,
  PeriodoContable,
} from "@/types/contable";

export const MOCK_CONTABLE_TENANT = "d3b00111-0000-0000-0000-000000d3b001";

const now = () => new Date().toISOString();

function cuentasSeed(tenantId: string): CuentaContable[] {
  const ts = now();
  const rows: Omit<CuentaContable, "id">[] = [
    { tenant_id: tenantId, codigo: "1", nombre: "Activos", tipo_cuenta: "activo", naturaleza: "deudora", cuenta_padre_id: null, nivel: 1, activa: true, created_at: ts, updated_at: ts },
    { tenant_id: tenantId, codigo: "11", nombre: "Activo corriente", tipo_cuenta: "activo", naturaleza: "deudora", cuenta_padre_id: null, nivel: 2, activa: true, created_at: ts, updated_at: ts },
    { tenant_id: tenantId, codigo: "1101", nombre: "Caja y bancos", tipo_cuenta: "activo", naturaleza: "deudora", cuenta_padre_id: null, nivel: 3, activa: true, created_at: ts, updated_at: ts },
    { tenant_id: tenantId, codigo: "1102", nombre: "Cuentas por cobrar", tipo_cuenta: "activo", naturaleza: "deudora", cuenta_padre_id: null, nivel: 3, activa: true, created_at: ts, updated_at: ts },
    { tenant_id: tenantId, codigo: "2", nombre: "Pasivos", tipo_cuenta: "pasivo", naturaleza: "acreedora", cuenta_padre_id: null, nivel: 1, activa: true, created_at: ts, updated_at: ts },
    { tenant_id: tenantId, codigo: "21", nombre: "Pasivo corriente", tipo_cuenta: "pasivo", naturaleza: "acreedora", cuenta_padre_id: null, nivel: 2, activa: true, created_at: ts, updated_at: ts },
    { tenant_id: tenantId, codigo: "2101", nombre: "Cuentas por pagar", tipo_cuenta: "pasivo", naturaleza: "acreedora", cuenta_padre_id: null, nivel: 3, activa: true, created_at: ts, updated_at: ts },
    { tenant_id: tenantId, codigo: "3", nombre: "Patrimonio", tipo_cuenta: "patrimonio", naturaleza: "acreedora", cuenta_padre_id: null, nivel: 1, activa: true, created_at: ts, updated_at: ts },
    { tenant_id: tenantId, codigo: "31", nombre: "Capital social", tipo_cuenta: "patrimonio", naturaleza: "acreedora", cuenta_padre_id: null, nivel: 2, activa: true, created_at: ts, updated_at: ts },
    { tenant_id: tenantId, codigo: "4", nombre: "Ingresos", tipo_cuenta: "ingreso", naturaleza: "acreedora", cuenta_padre_id: null, nivel: 1, activa: true, created_at: ts, updated_at: ts },
    { tenant_id: tenantId, codigo: "4101", nombre: "Ingresos por servicios", tipo_cuenta: "ingreso", naturaleza: "acreedora", cuenta_padre_id: null, nivel: 2, activa: true, created_at: ts, updated_at: ts },
    { tenant_id: tenantId, codigo: "5", nombre: "Gastos", tipo_cuenta: "gasto", naturaleza: "deudora", cuenta_padre_id: null, nivel: 1, activa: true, created_at: ts, updated_at: ts },
    { tenant_id: tenantId, codigo: "5101", nombre: "Gastos administrativos", tipo_cuenta: "gasto", naturaleza: "deudora", cuenta_padre_id: null, nivel: 2, activa: true, created_at: ts, updated_at: ts },
  ];
  const withIds = rows.map((r, i) => ({ ...r, id: `cuenta-${String(i + 1).padStart(3, "0")}` }));
  const byCode = new Map(withIds.map((c) => [c.codigo, c.id]));
  withIds[1]!.cuenta_padre_id = byCode.get("1")!;
  withIds[2]!.cuenta_padre_id = byCode.get("11")!;
  withIds[3]!.cuenta_padre_id = byCode.get("11")!;
  withIds[5]!.cuenta_padre_id = byCode.get("2")!;
  withIds[6]!.cuenta_padre_id = byCode.get("21")!;
  withIds[8]!.cuenta_padre_id = byCode.get("3")!;
  withIds[10]!.cuenta_padre_id = byCode.get("4")!;
  withIds[12]!.cuenta_padre_id = byCode.get("5")!;
  return withIds;
}

function periodosSeed(tenantId: string): PeriodoContable[] {
  const year = new Date().getFullYear();
  return Array.from({ length: 12 }, (_, i) => {
    const n = i + 1;
    const mm = String(n).padStart(2, "0");
    return {
      id: `periodo-${year}-${mm}`,
      tenant_id: tenantId,
      fiscal_year: year,
      period_number: n,
      label: `${year}-${mm}`,
      status: n < new Date().getMonth() + 1 ? "soft_closed" : n === new Date().getMonth() + 1 ? "open" : "open",
      fecha_inicio: `${year}-${mm}-01`,
      fecha_fin: `${year}-${mm}-28`,
    } as PeriodoContable;
  });
}

export function cloneContableSeed(tenantId: string) {
  return {
    cuentas: cuentasSeed(tenantId),
    periodos: periodosSeed(tenantId),
    asientos: [] as AsientoContable[],
  };
}
