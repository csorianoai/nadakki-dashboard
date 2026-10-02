/**
 * El mapper de asientos no inventa la moneda.
 *
 * `toAsiento` hacia `String(row.currency ?? "DOP")`: un asiento cuya moneda el
 * backend no informaba se convertia en un asiento en pesos dominicanos. Y tiraba
 * `functional_currency`, que el contrato SI devuelve
 * (`routers/contable/asientos_router.py:296-298`).
 *
 * La mutacion que motiva este fichero: al reponer el `?? "DOP"`, los tests del
 * formulario seguian verdes porque mockean el modulo entero. Sin este fichero el
 * defecto podia volver sin que nada se pusiera rojo.
 *
 * Vive en tests/components/contable --y no en tests/app-- para no abrir una
 * cuarta area y pasarme de GR-12. El modulo que mide es app/hooks/contable.
 */

const ROW = {
  id: "as-1",
  tenant_id: "tenant-ar",
  periodo_id: "p1",
  fecha: "2026-09-30",
  descripcion: "Venta",
  exchange_rate: 1,
  status: "draft",
  lineas: [],
  total_debe_base: 0,
  total_haber_base: 0,
  created_at: "2026-09-30T00:00:00Z",
  updated_at: "2026-09-30T00:00:00Z",
};

function respondeCon(row: Record<string, unknown>) {
  globalThis.fetch = jest.fn(async () => ({
    status: 201,
    ok: true,
    text: async () => JSON.stringify(row),
  })) as unknown as typeof fetch;
}

async function creaAsiento(row: Record<string, unknown>) {
  respondeCon(row);
  const { createAsiento } = await import("@/app/hooks/contable");
  return createAsiento("tenant-ar", {
    periodo_id: "p1",
    fecha: "2026-09-30",
    descripcion: "Venta",
    exchange_rate: 1,
    lineas: [],
  });
}

beforeAll(() => {
  process.env.NEXT_PUBLIC_CONTABLE_USE_MOCKS = "false";
});

describe("toAsiento, a traves de createAsiento", () => {
  it("conserva la moneda que informa el backend", async () => {
    const asiento = await creaAsiento({ ...ROW, currency: "ARS", functional_currency: "ARS" });
    expect(asiento.currency).toBe("ARS");
  });

  it("sin moneda en la respuesta devuelve null, NO DOP", async () => {
    const asiento = await creaAsiento({ ...ROW });
    expect(asiento.currency).toBeNull();
    expect(asiento.currency).not.toBe("DOP");
  });

  it("una moneda vacia tampoco se rellena", async () => {
    const asiento = await creaAsiento({ ...ROW, currency: "   " });
    expect(asiento.currency).toBeNull();
  });

  it("propaga functional_currency en vez de tirarla", async () => {
    const asiento = await creaAsiento({ ...ROW, currency: "USD", functional_currency: "ars" });
    expect(asiento.functional_currency).toBe("ARS");
  });

  it("sin functional_currency no inventa ninguna", async () => {
    const asiento = await creaAsiento({ ...ROW, currency: "ARS" });
    expect(asiento.functional_currency).toBeNull();
  });

  it("normaliza a mayusculas la moneda del asiento", async () => {
    const asiento = await creaAsiento({ ...ROW, currency: " ars " });
    expect(asiento.currency).toBe("ARS");
  });
});
