/**
 * Contrato de costos por vehiculo, medido sobre `origin/main` del backend.
 *
 * Los casos que importan son los que la base rechazaria: `cost_type` fuera del
 * CHECK, y una reparacion enviada por /costs sin proveedor ni factura. Las
 * mutaciones estan escritas a proposito: volver a "REPARACION", o mandar
 * `repair` por /costs, tiene que poner rojo.
 */
import {
  COSTS_CAPABILITY,
  COSTS_CAPABILITY_KEYS,
  COSTS_VEHICLE_CAPABILITY,
  COST_FORM_EMPTY,
  COST_PENDING_FIELDS,
  COST_TYPES,
  COST_TYPE_CHECK,
  COST_TYPE_REPAIR,
  costInPayload,
  esReparacion,
  fetchVehicleCostTotals,
  incurredAtIso,
  parseCostTotals,
  postCost,
  repairInvoicePayload,
  totalEnMoneda,
  validateCostForm,
  vehicleCostTotalPath,
} from "@/lib/dealer-management/vehicle-costs";
import { MIGRATION_097_CAPABILITY_KEYS } from "@/lib/dealer/core-status";

jest.mock("@/lib/api/fetch-client", () => ({ apiFetch: jest.fn() }));

import { apiFetch } from "@/lib/api/fetch-client";

const fetchMock = apiFetch as jest.MockedFunction<typeof apiFetch>;

const COMPRA = { ...COST_FORM_EMPTY, cost_type: "purchase", amount: "125000.50", incurred_at: "2026-09-30" };
const REPARACION = {
  ...COMPRA,
  cost_type: "repair",
  supplier_name: " Taller Sur ",
  invoice_number: " A-0001 ",
  document_id: " doc-1 ",
};

function ok(body: unknown) {
  return { ok: true, status: 200, json: async () => body } as unknown as Response;
}

describe("catalogo de cost_type", () => {
  it("todos los valores estan en el CHECK de la base", () => {
    for (const item of COST_TYPES) expect(COST_TYPE_CHECK.has(item.value)).toBe(true);
  });

  it("el CHECK es exactamente la enumeracion medida en el backend", () => {
    expect([...COST_TYPE_CHECK].sort()).toEqual(
      ["commission", "other", "purchase", "reconditioning", "repair", "tax", "transport"],
    );
  });

  it("los valores son codigos en ingles y la etiqueta es solo de UI", () => {
    const valores = COST_TYPES.map((item) => item.value);
    expect(valores).not.toContain("REPARACION");
    expect(valores).not.toContain("TRANSPORTE");
    expect(valores).not.toContain("PATENTAMIENTO");
    expect(valores).not.toContain("LIMPIEZA");
    for (const value of valores) expect(value).toMatch(/^[a-z_]+$/);
    expect(COST_TYPES.find((item) => item.value === "repair")?.label).toBe("Reparación");
    expect(COST_TYPES.find((item) => item.value === "reconditioning")?.label).toBe("Reacondicionamiento");
  });

  it("reparacion y reacondicionamiento son tipos distintos", () => {
    expect(COST_TYPE_REPAIR).toBe("repair");
    expect(esReparacion("repair")).toBe(true);
    expect(esReparacion("reconditioning")).toBe(false);
  });

  it("no se ofrece GESTORIA ni registration hasta P-A", () => {
    const valores = COST_TYPES.map((item) => item.value);
    expect(valores).not.toContain("registration");
    expect(valores).not.toContain("GESTORIA");
  });

  it("las dos claves de acceso salen del catalogo 097", () => {
    expect(MIGRATION_097_CAPABILITY_KEYS.has(COSTS_CAPABILITY)).toBe(true);
    expect(MIGRATION_097_CAPABILITY_KEYS.has(COSTS_VEHICLE_CAPABILITY)).toBe(true);
    expect(COSTS_CAPABILITY_KEYS).toEqual([COSTS_VEHICLE_CAPABILITY, COSTS_CAPABILITY]);
  });
});

describe("validateCostForm", () => {
  it("sin moneda del tenant no deja registrar", () => {
    expect(validateCostForm(COMPRA, null).currency).toContain("moneda funcional");
  });

  it("una compra completa no tiene errores y no exige factura", () => {
    expect(validateCostForm(COMPRA, "ARS")).toEqual({});
  });

  it("un tipo fuera del CHECK se para antes de la red", () => {
    expect(validateCostForm({ ...COMPRA, cost_type: "REPARACION" }, "ARS").cost_type).toBeDefined();
    expect(validateCostForm({ ...COMPRA, cost_type: "limpieza" }, "ARS").cost_type).toBeDefined();
  });

  it("reparacion exige proveedor, n.o de factura y document_id", () => {
    const errors = validateCostForm({ ...COMPRA, cost_type: "repair" }, "ARS");
    expect(errors.supplier_name).toBeDefined();
    expect(errors.invoice_number).toBeDefined();
    expect(errors.document_id).toBeDefined();
  });

  it("una reparacion completa pasa", () => {
    expect(validateCostForm(REPARACION, "ARS")).toEqual({});
  });

  it("rechaza montos que no son numero positivo de hasta dos decimales", () => {
    for (const amount of ["0", "-5", "abc", "1.234", ""]) {
      expect(validateCostForm({ ...COMPRA, amount }, "ARS").amount).toBeDefined();
    }
  });

  it("exige fecha", () => {
    expect(validateCostForm({ ...COMPRA, incurred_at: "" }, "ARS").incurred_at).toBeDefined();
    expect(incurredAtIso("2026-01-02")).toBe("2026-01-02T00:00:00Z");
  });

  it("el campo pendiente sigue declarado hasta la PARTE 3/3", () => {
    expect(COST_PENDING_FIELDS.map((field) => field.name)).toEqual(["is_opening"]);
  });

  it("is_opening solo viaja tildada", () => {
    expect(costInPayload({ ...COMPRA, is_opening: true }, "ARS")).toHaveProperty("is_opening", true);
    expect(costInPayload(COMPRA, "ARS")).not.toHaveProperty("is_opening");
  });
});

describe("payloads", () => {
  it("CostIn lleva exactamente los cuatro campos del contrato", () => {
    expect(costInPayload(COMPRA, "ARS")).toEqual({
      cost_type: "purchase",
      amount: "125000.50",
      currency: "ARS",
      incurred_at: "2026-09-30T00:00:00Z",
    });
  });

  it("CostIn se niega a transportar una reparacion", () => {
    expect(() => costInPayload(REPARACION, "ARS")).toThrow("REPAIR_REQUIERE_REPAIR_INVOICES");
  });

  it("RepairInvoiceIn lleva los tres identificadores, recortados", () => {
    expect(repairInvoicePayload(REPARACION, "ARS")).toEqual({
      amount: "125000.50",
      currency: "ARS",
      incurred_at: "2026-09-30T00:00:00Z",
      supplier_name: "Taller Sur",
      invoice_number: "A-0001",
      document_id: "doc-1",
    });
  });

  it("ningun payload lleva cost_type en espanol", () => {
    expect(JSON.stringify(costInPayload(COMPRA, "ARS"))).not.toContain("Compra");
  });
});

describe("parseCostTotals", () => {
  it("lee `total_cost` como texto, que es lo que devuelve el contrato", () => {
    expect(parseCostTotals([{ currency: "ARS", total_cost: "125000.50" }])).toEqual([
      { currency: "ARS", total: 125000.5 },
    ]);
  });

  it("sin asientos devuelve lista vacia, que es un cero real", () => {
    expect(parseCostTotals([])).toEqual([]);
    expect(parseCostTotals(null)).toEqual([]);
  });

  it("descarta filas sin moneda valida o sin importe", () => {
    expect(parseCostTotals([{ currency: "AR", total_cost: "10" }])).toEqual([]);
    expect(parseCostTotals([{ currency: "ARS" }])).toEqual([]);
  });

  it("no suma monedas distintas", () => {
    const totals = [
      { currency: "ARS", total: 100 },
      { currency: "USD", total: 7 },
    ];
    expect(totalEnMoneda(totals, "ars")).toEqual({ currency: "ARS", total: 100 });
    expect(totalEnMoneda(totals, "EUR")).toBeNull();
    expect(totalEnMoneda(totals, null)).toBeNull();
  });
});

describe("clientes HTTP", () => {
  beforeEach(() => fetchMock.mockReset());

  it("el total se pide con el tenant en cabecera", async () => {
    fetchMock.mockResolvedValue(ok([{ currency: "ARS", total_cost: "5" }]));
    await expect(fetchVehicleCostTotals("veh 1", "tenant-a")).resolves.toEqual([
      { currency: "ARS", total: 5 },
    ]);
    const [path, init] = fetchMock.mock.calls[0];
    expect(path).toBe(vehicleCostTotalPath("veh 1"));
    expect(path).toBe("/api/v1/autos/vehicles/veh%201/costs/total");
    expect((init?.headers as Record<string, string>)["X-Tenant-ID"]).toBe("tenant-a");
  });

  it("una compra va por /costs", async () => {
    fetchMock.mockResolvedValue(ok({ id: "cost-1" }));
    await postCost("veh-1", "tenant-a", COMPRA, "ARS");
    const [path, init] = fetchMock.mock.calls[0];
    expect(path).toBe("/api/v1/autos/vehicles/veh-1/costs");
    expect(JSON.parse(String(init?.body)).cost_type).toBe("purchase");
  });

  it("una reparacion va por /repair-invoices, no por /costs", async () => {
    fetchMock.mockResolvedValue(ok({ id: "cost-2", margins: [] }));
    await postCost("veh-1", "tenant-a", REPARACION, "ARS");
    const [path, init] = fetchMock.mock.calls[0];
    expect(path).toBe("/api/v1/autos/vehicles/veh-1/repair-invoices");
    const body = JSON.parse(String(init?.body)) as Record<string, unknown>;
    expect(body.supplier_name).toBe("Taller Sur");
    expect(body.invoice_number).toBe("A-0001");
    expect(body.document_id).toBe("doc-1");
    expect(body.cost_type).toBeUndefined();
  });

  it("un 422 del CHECK se propaga en vez de resolverse en silencio", async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      status: 422,
      json: async () => ({ reason_code: "CONSTRAINT" }),
    } as unknown as Response);
    await expect(postCost("veh-1", "tenant-a", COMPRA, "ARS")).rejects.toMatchObject({
      status: 422,
      reason_code: "CONSTRAINT",
    });
  });
});
