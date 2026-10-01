/**
 * Contrato de costos por vehiculo, medido contra el OpenAPI vivo.
 *
 * Los casos que importan son los de lo que el backend NO tiene: no hay GET de
 * la lista de costos y `CostIn` no acepta proveedor, factura ni gasto de
 * apertura. Si alguien añade esos campos al payload, estos casos caen.
 */
import {
  COSTS_CAPABILITY,
  COSTS_CAPABILITY_KEYS,
  COSTS_VEHICLE_CAPABILITY,
  COST_FORM_EMPTY,
  COST_PENDING_FIELDS,
  COST_TYPES,
  COST_TYPE_REPARACION,
  costInPayload,
  fetchVehicleCostTotals,
  incurredAtIso,
  parseCostTotals,
  totalEnMoneda,
  validateCostForm,
  vehicleCostTotalPath,
} from "@/lib/dealer-management/vehicle-costs";
import { MIGRATION_097_CAPABILITY_KEYS } from "@/lib/dealer/core-status";

jest.mock("@/lib/api/fetch-client", () => ({ apiFetch: jest.fn() }));

import { apiFetch } from "@/lib/api/fetch-client";

const fetchMock = apiFetch as jest.MockedFunction<typeof apiFetch>;

const VALIDO = { cost_type: COST_TYPE_REPARACION, amount: "125000.50", incurred_at: "2026-09-30" };

describe("capabilities", () => {
  it("ambas claves salen del catalogo 097 y no se inventan", () => {
    expect(MIGRATION_097_CAPABILITY_KEYS.has(COSTS_CAPABILITY)).toBe(true);
    expect(MIGRATION_097_CAPABILITY_KEYS.has(COSTS_VEHICLE_CAPABILITY)).toBe(true);
    expect(COSTS_CAPABILITY_KEYS).toEqual([COSTS_VEHICLE_CAPABILITY, COSTS_CAPABILITY]);
  });
});

describe("validateCostForm", () => {
  it("sin moneda del tenant no deja registrar", () => {
    expect(validateCostForm(VALIDO, null).currency).toContain("moneda funcional");
  });

  it("con moneda y datos completos no hay errores", () => {
    expect(validateCostForm(VALIDO, "ARS")).toEqual({});
  });

  it("exige monto y fecha", () => {
    const errors = validateCostForm(COST_FORM_EMPTY, "ARS");
    expect(errors.amount).toBeDefined();
    expect(errors.incurred_at).toBeDefined();
  });

  it("rechaza montos que no son numero positivo de hasta dos decimales", () => {
    for (const amount of ["0", "-5", "abc", "1.234", ""]) {
      expect(validateCostForm({ ...VALIDO, amount }, "ARS").amount).toBeDefined();
    }
    expect(validateCostForm({ ...VALIDO, amount: "1" }, "ARS").amount).toBeUndefined();
  });

  it("rechaza un tipo mas largo que el maximo del contrato", () => {
    expect(validateCostForm({ ...VALIDO, cost_type: "x".repeat(41) }, "ARS").cost_type).toBeDefined();
  });

  it("REPARACION no se bloquea por proveedor ni factura, porque el contrato no los acepta", () => {
    expect(validateCostForm({ ...VALIDO, cost_type: COST_TYPE_REPARACION }, "ARS")).toEqual({});
    expect(COST_PENDING_FIELDS.map((field) => field.label)).toEqual([
      "Proveedor",
      "N.º de factura",
      "Gasto de apertura",
    ]);
  });

  it("REPARACION es el primer tipo del catalogo del panel", () => {
    expect(COST_TYPES[0].value).toBe(COST_TYPE_REPARACION);
    expect(COST_FORM_EMPTY.cost_type).toBe(COST_TYPE_REPARACION);
  });
});

describe("costInPayload", () => {
  it("manda exactamente los campos de CostIn", () => {
    expect(costInPayload(VALIDO, "ARS")).toEqual({
      cost_type: "REPARACION",
      amount: "125000.50",
      currency: "ARS",
      incurred_at: "2026-09-30T00:00:00Z",
    });
  });

  it("no inventa proveedor, factura ni gasto de apertura", () => {
    const keys = Object.keys(costInPayload(VALIDO, "ARS"));
    for (const field of COST_PENDING_FIELDS) expect(keys).not.toContain(field.name);
  });

  it("el monto viaja como texto para no perder el decimal", () => {
    expect(costInPayload({ ...VALIDO, amount: " 0.10 " }, "ARS").amount).toBe("0.10");
  });

  it("la fecha del formulario se completa a date-time", () => {
    expect(incurredAtIso("2026-01-02")).toBe("2026-01-02T00:00:00Z");
    expect(incurredAtIso("2026-01-02T15:30:00Z")).toBe("2026-01-02T15:30:00Z");
  });
});

describe("parseCostTotals", () => {
  it("lee una fila por moneda y normaliza el codigo", () => {
    expect(parseCostTotals([{ currency: "ars", total: 125000.5 }])).toEqual([
      { currency: "ARS", total: 125000.5 },
    ]);
  });

  it("acepta el total como texto sin perderlo", () => {
    expect(parseCostTotals({ totals: [{ currency: "ARS", total_amount: "900.25" }] })).toEqual([
      { currency: "ARS", total: 900.25 },
    ]);
  });

  it("sin asientos devuelve lista vacia, que es un cero real y no un fallo", () => {
    expect(parseCostTotals([])).toEqual([]);
    expect(parseCostTotals({ totals: [] })).toEqual([]);
    expect(parseCostTotals(null)).toEqual([]);
  });

  it("descarta filas sin moneda valida o sin importe en vez de poner un cero inventado", () => {
    expect(parseCostTotals([{ currency: "AR", total: 10 }])).toEqual([]);
    expect(parseCostTotals([{ currency: "ARS" }])).toEqual([]);
    expect(parseCostTotals([{ total: 10 }])).toEqual([]);
  });
});

describe("totalEnMoneda", () => {
  const totals = [
    { currency: "ARS", total: 100 },
    { currency: "USD", total: 7 },
  ];

  it("devuelve la fila de la moneda del tenant y no suma monedas distintas", () => {
    expect(totalEnMoneda(totals, "ars")).toEqual({ currency: "ARS", total: 100 });
    expect(totalEnMoneda(totals, "USD")).toEqual({ currency: "USD", total: 7 });
  });

  it("sin moneda del tenant no elige una fila al azar", () => {
    expect(totalEnMoneda(totals, null)).toBeNull();
  });

  it("si el tenant usa una moneda sin asientos no devuelve otra", () => {
    expect(totalEnMoneda(totals, "EUR")).toBeNull();
  });
});

describe("fetchVehicleCostTotals", () => {
  beforeEach(() => fetchMock.mockReset());

  it("pide el total del vehiculo con el tenant en cabecera", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => [{ currency: "ARS", total: 5 }],
    } as unknown as Response);

    await expect(fetchVehicleCostTotals("veh 1", "tenant-a")).resolves.toEqual([
      { currency: "ARS", total: 5 },
    ]);
    const [path, init] = fetchMock.mock.calls[0];
    expect(path).toBe(vehicleCostTotalPath("veh 1"));
    expect(path).toBe("/api/v1/autos/vehicles/veh%201/costs/total");
    expect((init?.headers as Record<string, string>)["X-Tenant-ID"]).toBe("tenant-a");
  });

  it("un 403 se propaga con reason_code en vez de devolver cero", async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      status: 403,
      json: async () => ({ reason_code: "DEFAULT_DENY" }),
    } as unknown as Response);

    await expect(fetchVehicleCostTotals("veh-1", "tenant-a")).rejects.toMatchObject({
      status: 403,
      reason_code: "DEFAULT_DENY",
    });
  });
});
