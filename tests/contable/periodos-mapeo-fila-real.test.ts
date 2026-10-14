/**
 * Periodos sin nombre en blanco (auditoria Mapaal QA, P1).
 *
 * `contable_periodos` trae start_date/end_date y ninguna columna de nombre. El
 * mapeo leia `label`, `fecha_inicio` y `fecha_fin` --que no llegan-- y Libro
 * mayor, Periodos y Balance pintaban el periodo vacio; Balance mostraba solo
 * "(open)". Se mide con la forma REAL de la fila, a traves de `listPeriodos`.
 */
const FILA_REAL = {
  id: "per-7",
  tenant_id: "mapaal",
  fiscal_year: 2026,
  period_number: 7,
  start_date: "2026-07-01",
  end_date: "2026-07-31",
  status: "open",
};

describe("listPeriodos con la fila real de contable_periodos", () => {
  const fetchOriginal = global.fetch;
  const envOriginal = process.env.NEXT_PUBLIC_CONTABLE_USE_MOCKS;

  beforeEach(() => {
    jest.resetModules();
    process.env.NEXT_PUBLIC_CONTABLE_USE_MOCKS = "false";
    global.fetch = jest.fn(async () => ({
      ok: true,
      status: 200,
      json: async () => [FILA_REAL],
      text: async () => JSON.stringify([FILA_REAL]),
    })) as unknown as typeof fetch;
  });

  afterEach(() => {
    global.fetch = fetchOriginal;
    process.env.NEXT_PUBLIC_CONTABLE_USE_MOCKS = envOriginal;
  });

  it("construye el nombre y toma inicio y fin de start_date/end_date", async () => {
    jest.doMock("@/lib/api/fetch-client", () => ({
      getAuthHeaders: () => ({}),
      resolveApiUrl: (p: string) => `http://api.test${p}`,
    }));
    const { listPeriodos } = await import("@/app/hooks/contable");
    const [p] = await listPeriodos("mapaal", 2026);
    expect(p.label).toBe("Julio 2026");
    expect(p.fecha_inicio).toBe("2026-07-01");
    expect(p.fecha_fin).toBe("2026-07-31");
  });
});
