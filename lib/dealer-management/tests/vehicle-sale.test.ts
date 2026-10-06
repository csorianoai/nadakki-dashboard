jest.mock("@/lib/api/fetch-client", () => ({ apiFetch: jest.fn() }));

import {
  SALE_FORM_EMPTY,
  blocksStatusChangeInEdit,
  isSold,
  editableStatuses,
  validateSaleForm,
} from "../vehicle-sale";

describe("venta de vehiculo (D6)", () => {
  it("la edicion no ofrece 'vendido' y bloquea ese destino", () => {
    expect(editableStatuses(["draft", "disponible", "reservado", "vendido", "archivado"])).toEqual([
      "draft",
      "disponible",
      "reservado",
      "archivado",
    ]);
    expect(blocksStatusChangeInEdit("vendido")).toBe(true);
    expect(blocksStatusChangeInEdit(" VENDIDO ")).toBe(true);
    expect(blocksStatusChangeInEdit("reservado")).toBe(false);
    expect(blocksStatusChangeInEdit(null)).toBe(false);
  });

  it("exige precio, fecha y moneda del tenant", () => {
    expect(Object.keys(validateSaleForm(SALE_FORM_EMPTY, null)).sort()).toEqual([
      "currency",
      "sale_price_amount",
      "sold_at",
    ]);
    expect(validateSaleForm({ sale_price_amount: "18.500.000,50", sold_at: "2026-10-01T10:00" }, "DOP")).toEqual({});
    expect(validateSaleForm({ sale_price_amount: "0", sold_at: "2026-10-01T10:00" }, "DOP").sale_price_amount).toBeDefined();
  });

  it("'vendido' se reconoce sin importar mayusculas ni espacios", () => {
    expect(isSold("VENDIDO")).toBe(true);
    expect(isSold(" Vendido ")).toBe(true);
    expect(isSold("reservado")).toBe(false);
    expect(isSold(null)).toBe(false);
    expect(editableStatuses(["disponible", "VENDIDO", " Vendido "])).toEqual(["disponible"]);
  });
});
