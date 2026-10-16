jest.mock("@/lib/api/fetch-client", () => ({ apiFetch: jest.fn(), getAuthHeaders: () => ({}) }));

import { mapOperations } from "@/lib/realtor/operaciones/api";

const op = { id: "00000000-0000-4000-8000-000000005201", kind: "rental", status: "in_progress", agreed_price: { amount: "1800", currency: "USD" } };

describe("mapOperations (C-RE-OLA3)", () => {
  it("traduce tipo y estado; sin etapa informada la etapa es null", () => {
    const [o] = mapOperations([op]);
    expect(o).toMatchObject({ id: op.id, kind: "alquiler", stage: null, code: "Alquiler 00000000" });
    expect(o.summary).toEqual({ es: "Estado: en curso · USD 1,800", en: "Status: in progress · USD 1,800" });
  });
  it("venta sin precio pactado no muestra importe", () => {
    expect(mapOperations([{ ...op, kind: "sale", agreed_price: null }])[0].summary.es).toBe("Estado: en curso");
  });
  it("descarta filas inválidas, nunca inventa", () => {
    expect(mapOperations([{ ...op, kind: "x" }, { ...op, status: "x" }, { ...op, id: "" }, 5, null])).toEqual([]);
  });
});
