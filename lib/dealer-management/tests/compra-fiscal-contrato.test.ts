/** F4F-6 parte 1: neto+IVA = costo y mensajes de los reason_code fiscales del backend. */
import { MENSAJE_ALTA, PURCHASE_EMPTY, validatePurchase, type PurchaseForm } from "@/lib/dealer-management/vehicle-purchase";

const base = (extra: Partial<PurchaseForm> = {}): PurchaseForm => ({
  ...PURCHASE_EMPTY, cost: "1000000", acquired_on: "2026-11-01", currency: "ARS", country_code: "AR",
  acquisition_mode_code: "compra", seller_contact_id: "11111111-1111-4111-8111-111111111111",
  payment_lines: [{ method: "cash", amount: "1000000", cheque_number: "", bank: "", cobro_date: "", detail: "" }],
  seller_tax_status: "responsable_inscripto", voucher_kind: "factura", invoice_letter: "A", invoice_pos: "1",
  invoice_number: "2", net_amount: "826446,28", vat_amount: "173553,72", vat_rate: "21", ...extra,
});

describe("compra fiscal: total de la factura", () => {
  it("neto + IVA igual al costo no da error", () => {
    expect(validatePurchase(base(), "ARS")).toEqual({});
  });
  it("neto + IVA distinto del costo bloquea con mensaje llano", () => {
    const e = validatePurchase(base({ net_amount: "1000,00", vat_amount: "210,00" }), "ARS");
    expect(e.net_amount).toMatch(/neto más el IVA/i);
  });
  it("el comprobante interno no exige total", () => {
    expect(validatePurchase(base({ voucher_kind: "interno" }), "ARS")).toEqual({});
  });
});

describe("mensajes de los reason_code fiscales", () => {
  it("esquema fiscal no aplicado dice que estara disponible al activarse", () => {
    expect(MENSAJE_ALTA.ESQUEMA_FISCAL_NO_APLICADO).toMatch(/Disponible cuando se active la contabilidad fiscal/);
  });
  it("FISCAL_TOTAL_MISMATCH tiene mensaje propio", () => {
    expect(MENSAJE_ALTA.FISCAL_TOTAL_MISMATCH).toMatch(/neto más el IVA/i);
  });
});
