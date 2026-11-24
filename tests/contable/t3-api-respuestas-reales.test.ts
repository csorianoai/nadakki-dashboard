const MAYOR_REAL = [
  { tenant_id: "tenant-ar", cuenta_id: "cuenta-1220", codigo: "1220", nombre: "Cuenta por cobrar", periodo_id: "periodo-11", total_debe: 10_000_000, total_haber: 0, saldo: 10_000_000 },
  { tenant_id: "tenant-ar", cuenta_id: "cuenta-2010", codigo: "2010", nombre: "Cuentas por pagar", periodo_id: "periodo-11", total_debe: 0, total_haber: 10_000_000, saldo: -10_000_000 },
];

const BALANCE_REAL = {
  cuentas: MAYOR_REAL.map(({ cuenta_id, codigo, nombre, total_debe, total_haber, saldo }) => ({ cuenta_id, codigo, nombre, total_debe, total_haber, saldo })),
  total_debe: 10_000_000,
  total_haber: 10_000_000,
  cuadra: true,
};

const RESULTADOS_REAL = [
  { tipo_cuenta: "ingreso", codigo: "4010", nombre: "Ventas", total_debe: 0, total_haber: 2_000_000, saldo: 2_000_000 },
  { tipo_cuenta: "gasto", codigo: "6010", nombre: "Gastos operativos", total_debe: 500_000, total_haber: 0, saldo: 500_000 },
];

describe("adaptadores contables al contrato real del backend", () => {
  const originalFetch = global.fetch;
  const originalMocks = process.env.NEXT_PUBLIC_CONTABLE_USE_MOCKS;

  beforeEach(() => {
    jest.resetModules();
    process.env.NEXT_PUBLIC_CONTABLE_USE_MOCKS = "false";
    jest.doMock("@/lib/api/fetch-client", () => ({
      getAuthHeaders: () => ({}),
      resolveApiUrl: (path: string) => `http://contable.test${path}`,
    }));
    global.fetch = jest.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      const payload = url.includes("balance-comprobacion")
        ? BALANCE_REAL
        : url.includes("estado-resultados")
          ? RESULTADOS_REAL
          : MAYOR_REAL;
      return { ok: true, status: 200, text: async () => JSON.stringify(payload) } as Response;
    });
  });

  afterEach(() => {
    global.fetch = originalFetch;
    if (originalMocks === undefined) delete process.env.NEXT_PUBLIC_CONTABLE_USE_MOCKS;
    else process.env.NEXT_PUBLIC_CONTABLE_USE_MOCKS = originalMocks;
    jest.dontMock("@/lib/api/fetch-client");
  });

  it("conserva los dos resúmenes reales del mayor y permite omitir filtros", async () => {
    const { getLibroMayor } = await import("@/app/hooks/contable");
    await expect(getLibroMayor("tenant-ar", undefined, undefined)).resolves.toEqual(MAYOR_REAL);
    expect(String((global.fetch as jest.Mock).mock.calls.at(-1)?.[0])).toBe("http://contable.test/api/v1/contable/mayor");
  });

  it("elige el período que contiene la fecha de hoy aunque los doce estén abiertos", async () => {
    const periods = Array.from({ length: 12 }, (_, i) => ({ id: `p${i + 1}`, fecha_inicio: `2026-${String(i + 1).padStart(2, "0")}-01`, fecha_fin: `2026-${String(i + 1).padStart(2, "0")}-31` }));
    const { periodoQueContieneFecha } = await import("@/app/hooks/contable");
    expect(periodoQueContieneFecha(periods as never, "2026-11-24")?.id).toBe("p11");
  });

  it("adapta cuentas y totales del balance sin convertirlos en cero", async () => {
    const { getBalanceComprobacion } = await import("@/app/hooks/contable");
    await expect(getBalanceComprobacion("tenant-ar", "periodo-11")).resolves.toEqual({
      periodo_id: "periodo-11",
      rows: BALANCE_REAL.cuentas,
      totals: { total_debe: 10_000_000, total_haber: 10_000_000, cuadra: true },
    });
  });

  it("consulta todos los períodos del balance al omitir periodo_id", async () => {
    const { getBalanceComprobacion } = await import("@/app/hooks/contable");
    await getBalanceComprobacion("tenant-ar", undefined);
    expect(String((global.fetch as jest.Mock).mock.calls.at(-1)?.[0])).toBe("http://contable.test/api/v1/contable/balance-comprobacion");
  });

  it("adapta filas por cuenta del estado de resultados usando periodo_id", async () => {
    const { getEstadoResultadosPorPeriodo } = await import("@/app/hooks/contable");
    const result = await getEstadoResultadosPorPeriodo("tenant-ar", "periodo-11");
    expect(result.ingresos).toEqual([{ codigo: "4010", nombre: "Ventas", total: 2_000_000 }]);
    expect(result.gastos).toEqual([{ codigo: "6010", nombre: "Gastos operativos", total: 500_000 }]);
    expect(result.total_ingresos).toBe(2_000_000);
    expect(result.utilidad_neta).toBe(1_500_000);
    expect(String((global.fetch as jest.Mock).mock.calls.at(-1)?.[0])).toBe("http://contable.test/api/v1/contable/reports/estado-resultados?periodo_id=periodo-11");
  });
});
