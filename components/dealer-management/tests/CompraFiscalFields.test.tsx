/**
 * F4F-6 parte 1: condicion fiscal del vendedor y comprobante en la compra (criterio del contador, punto 1).
 * Render sin red: el componente no pide nada, solo pinta y devuelve el formulario.
 */
import { useState } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { CompraFiscalFields } from "@/components/dealer-management/CompraFiscalFields";
import { PURCHASE_EMPTY, purchasePayload, validatePurchase, type PurchaseForm } from "@/lib/dealer-management/vehicle-purchase";

function Host({ inicial = PURCHASE_EMPTY, errors = {} }: { inicial?: PurchaseForm; errors?: Record<string, string> }) {
  const [v, setV] = useState(inicial);
  return <CompraFiscalFields value={v} onChange={setV} errors={errors} />;
}

function valida(extra: Partial<PurchaseForm> = {}): PurchaseForm {
  return {
    ...PURCHASE_EMPTY,
    cost: "1000000", acquired_on: "2026-11-01", currency: "ARS", country_code: "AR",
    acquisition_mode_code: "compra", seller_contact_id: "11111111-1111-4111-8111-111111111111",
    payment_lines: [{ method: "cash", amount: "1000000", cheque_number: "", bank: "", cobro_date: "", detail: "" }],
    ...extra,
  };
}

describe("CompraFiscalFields", () => {
  it("pide la condicion fiscal del vendedor con cuatro opciones", () => {
    render(<Host />);
    const sel = screen.getByLabelText(/condición fiscal del vendedor/i) as HTMLSelectElement;
    const textos = Array.from(sel.options).map((o) => o.value);
    expect(textos).toEqual(["", "consumidor_final", "monotributista", "responsable_inscripto", "exento"]);
  });

  it("consumidor_final no ofrece factura: solo comprobante interno", () => {
    render(<Host inicial={valida({ seller_tax_status: "consumidor_final" })} />);
    expect(screen.getByTestId("compra-comprobante-interno")).toHaveTextContent(/comprobante interno/i);
    expect(screen.queryByLabelText(/^comprobante/i)).toBeNull();
    expect(screen.queryByLabelText(/letra/i)).toBeNull();
    expect(screen.queryByLabelText(/alícuota/i)).toBeNull();
  });

  it("una empresa ofrece factura y, al elegirla, pide cada dato de la factura", () => {
    render(<Host inicial={valida({ seller_tax_status: "responsable_inscripto" })} />);
    fireEvent.change(screen.getByLabelText(/^comprobante/i), { target: { value: "factura" } });
    for (const campo of [/letra/i, /punto de venta/i, /número de factura/i, /neto/i, /^IVA/i, /alícuota/i]) {
      expect(screen.getByLabelText(campo)).toBeInTheDocument();
    }
  });

  it("la alicuota no trae valor por defecto", () => {
    render(<Host inicial={valida({ seller_tax_status: "monotributista", voucher_kind: "factura" })} />);
    expect((screen.getByLabelText(/alícuota/i) as HTMLInputElement).value).toBe("");
  });
});

describe("compra fiscal: validacion y payload", () => {
  it("consumidor_final viaja con comprobante interno y sin datos de factura", () => {
    const p = purchasePayload(valida({ seller_tax_status: "consumidor_final" }), "ARS");
    expect(p.fiscal).toEqual({ seller_tax_status: "consumidor_final", voucher_kind: "interno" });
  });

  it("consumidor_final con una factura vieja cargada no la envia", () => {
    const p = purchasePayload(valida({ seller_tax_status: "consumidor_final", voucher_kind: "factura", net_amount: "1" }), "ARS");
    expect(p.fiscal).toEqual({ seller_tax_status: "consumidor_final", voucher_kind: "interno" });
  });

  it("empresa con factura envia letra, punto, numero, neto, IVA y alicuota", () => {
    const p = purchasePayload(valida({
      seller_tax_status: "responsable_inscripto", voucher_kind: "factura", invoice_letter: "A", invoice_pos: "12",
      invoice_number: "345", net_amount: "1000,00", vat_amount: "210,00", vat_rate: "21",
    }), "ARS");
    expect(p.fiscal).toEqual({
      seller_tax_status: "responsable_inscripto", voucher_kind: "factura", invoice_letter: "A", invoice_pos: "12",
      invoice_number: "345", net_amount: "1000.00", vat_amount: "210.00", vat_rate: "21",
    });
  });

  it("factura sin alicuota bloquea: no se supone ninguna", () => {
    const e = validatePurchase(valida({
      seller_tax_status: "exento", voucher_kind: "factura", invoice_letter: "C", invoice_pos: "1",
      invoice_number: "2", net_amount: "100", vat_amount: "0",
    }), "ARS");
    expect(e.vat_rate).toMatch(/alícuota/i);
  });

  it("el IVA que no sale del neto por la alicuota bloquea", () => {
    const e = validatePurchase(valida({
      seller_tax_status: "responsable_inscripto", voucher_kind: "factura", invoice_letter: "A", invoice_pos: "1",
      invoice_number: "2", net_amount: "100", vat_amount: "50", vat_rate: "21",
    }), "ARS");
    expect(e.vat_amount).toMatch(/neto/i);
  });

  it("sin condicion fiscal no se envia bloque fiscal (no se inventa)", () => {
    expect(purchasePayload(valida(), "ARS").fiscal).toBeUndefined();
  });

  it("el cheque diferido es un medio de pago de la compra y exige fecha de cobro", () => {
    const linea = { method: "cheque_diferido" as const, amount: "1000000", cheque_number: "9", bank: "Nación", cobro_date: "", detail: "" };
    expect(validatePurchase(valida({ payment_lines: [linea] }), "ARS").payment_0_cobro_date).toBeTruthy();
    const p = purchasePayload(valida({ payment_lines: [{ ...linea, cobro_date: "2027-02-01" }] }), "ARS");
    expect((p.payments as Array<Record<string, unknown>>)[0]).toMatchObject({ method: "cheque_diferido", check_cash_date: "2027-02-01" });
  });
});
