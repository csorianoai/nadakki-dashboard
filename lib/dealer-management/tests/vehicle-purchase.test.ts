/**
 * Alta con compra (F4C-5, 3.1 de backend#2548): validacion en pantalla y payload.
 */
import {
  FX_SOURCES,
  PURCHASE_EMPTY,
  purchasePayload,
  validatePurchase,
  type PurchaseForm,
} from "@/lib/dealer-management/vehicle-purchase";

function valida(extra: Partial<PurchaseForm> = {}): PurchaseForm {
  return {
    ...PURCHASE_EMPTY,
    cost: "1000000",
    acquired_on: "2026-11-01",
    currency: "ARS",
    payment_lines: [{ method: "cash", amount: "1000000", cheque_number: "", bank: "", cobro_date: "", detail: "" }],
    ...extra,
  };
}

describe("validatePurchase", () => {
  it("una compra completa no tiene errores", () => {
    expect(validatePurchase(valida(), "ARS")).toEqual({});
  });

  it("sin costo no pasa", () => {
    expect(validatePurchase(valida({ cost: "" }), "ARS").cost).toMatch(/obligatorio/i);
  });

  it("la suma de pagos distinta del costo bloquea", () => {
    const form = valida({
      payment_lines: [{ method: "cash", amount: "900000", cheque_number: "", bank: "", cobro_date: "", detail: "" }],
    });
    expect(validatePurchase(form, "ARS").payment_sum).toMatch(/costo/i);
  });

  it("cheque sin fecha de cobro bloquea", () => {
    const form = valida({
      payment_lines: [
        { method: "cheque", amount: "1000000", cheque_number: "123", bank: "Nación", cobro_date: "", detail: "" },
      ],
    });
    expect(validatePurchase(form, "ARS")["payment_0_cobro_date"]).toBeDefined();
  });

  it("cheque sin numero ni banco bloquea", () => {
    const form = valida({
      payment_lines: [{ method: "cheque", amount: "1000000", cheque_number: "", bank: "", cobro_date: "2026-12-01", detail: "" }],
    });
    const errors = validatePurchase(form, "ARS");
    expect(errors["payment_0_cheque_number"]).toBeDefined();
    expect(errors["payment_0_bank"]).toBeDefined();
  });

  it("pago 'otro' sin detalle bloquea", () => {
    const form = valida({
      payment_lines: [{ method: "other", amount: "1000000", cheque_number: "", bank: "", cobro_date: "", detail: "" }],
    });
    expect(validatePurchase(form, "ARS")["payment_0_detail"]).toBeDefined();
  });

  it("fuente 'otra' sin detalle bloquea", () => {
    const form = valida({ currency: "USD", fx_rate: "1200", fx_source: "otra", fx_source_detail: "" });
    expect(validatePurchase(form, "ARS").fx_source_detail).toBeDefined();
  });

  it("moneda distinta de la funcional pide tipo de cambio y fuente", () => {
    const errors = validatePurchase(valida({ currency: "USD" }), "ARS");
    expect(errors.fx_rate).toBeDefined();
    expect(errors.fx_source).toBeDefined();
  });

  it("la lista de fuentes es la fija", () => {
    expect(FX_SOURCES.map((s) => s.value)).toEqual(["oficial_bna", "mep", "blue", "acordado", "otra"]);
  });

  it("compara la suma en centavos, sin error de coma flotante", () => {
    const linea = (amount: string) => ({
      method: "cash" as const, amount, cheque_number: "", bank: "", cobro_date: "", detail: "",
    });
    const form = valida({ cost: "0.30", payment_lines: [linea("0.10"), linea("0.20")] });
    expect(validatePurchase(form, "ARS").payment_sum).toBeUndefined();
  });
});

describe("purchasePayload", () => {
  it("serializa importes como string decimal y omite lo vacio", () => {
    const payload = purchasePayload(valida({ engine_number: " ABC1 ", docs: { ...PURCHASE_EMPTY.docs, titulo: true } }));
    expect(payload.cost).toBe("1000000");
    expect(payload.currency).toBe("ARS");
    expect(payload.engine_number).toBe("ABC1");
    expect(payload.documentation).toEqual({ titulo: true, form_08: false, cedula: false, vtv: false, cheque: false });
    expect(payload).not.toHaveProperty("fx_rate");
    expect(payload).not.toHaveProperty("seller_contact_id");
  });
});
