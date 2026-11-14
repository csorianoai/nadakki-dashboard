/**
 * Alta con compra (F4C-5, 3.1 de backend#2548): validacion en pantalla y payload.
 */
import {
  FX_SOURCES,
  createVehiclePurchase,
  PURCHASE_EMPTY,
  purchasePayload,
  validatePurchase,
  type PurchaseForm,
} from "@/lib/dealer-management/vehicle-purchase";

jest.mock("@/lib/api/fetch-client", () => ({ apiFetch: jest.fn() }));
import { VEHICLE_FORM_EMPTY } from "@/lib/dealer-management/vehicle-manual";
import { apiFetch } from "@/lib/api/fetch-client";
const fetchMock = apiFetch as jest.MockedFunction<typeof apiFetch>;

function valida(extra: Partial<PurchaseForm> = {}): PurchaseForm {
  return {
    ...PURCHASE_EMPTY,
    cost: "1000000",
    acquired_on: "2026-11-01",
    currency: "ARS",
    country_code: "AR", acquisition_mode_code: "stock_inicial", seller_contact_id: "11111111-1111-4111-8111-111111111111",
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
    const payload = purchasePayload(valida({ engine_number: " ABC1 ", docs: { ...PURCHASE_EMPTY.docs, titulo: true } }), "ARS");
    expect(payload.amount).toBe("1000000");
    expect(payload.currency).toBe("ARS");
    expect(payload).not.toHaveProperty("engine_number");
    expect(payload).not.toHaveProperty("documentation");
    expect(payload.payments).toEqual([{ method: "efectivo", amount: "1000000" }]);
    expect(payload).not.toHaveProperty("fx_rate");
    expect(payload.seller_contact_id).toBe("11111111-1111-4111-8111-111111111111");
  });
});

describe("moneda funcional desconocida o igual (fail-closed)", () => {
  it("moneda funcional desconocida con USD sin tipo de cambio da error", () => {
    const errors = validatePurchase(valida({ currency: "USD" }), null);
    expect(errors.fx_rate).toBeDefined();
    expect(errors.fx_source).toBeDefined();
  });

  it("purchasePayload sin moneda funcional y USD sin fx lanza", () => {
    expect(() => purchasePayload(valida({ currency: "USD" }), null)).toThrow();
  });

  it("moneda igual a la funcional omite fx_* del payload", () => {
    const payload = purchasePayload(valida({ fx_rate: "abc", fx_source: "mep" }), "ARS");
    expect(payload).not.toHaveProperty("fx");
  });

  it("USD con tipo de cambio valido envia fx anidado", () => {
    const form = valida({ currency: "USD", fx_rate: "1200,5", fx_source: "mep", fx_as_of: "2026-11-01" });
    expect(purchasePayload(form, "ARS").fx).toMatchObject({ rate: "1200.5", source: "mep" });
  });
});

describe("createVehiclePurchase", () => {
  beforeEach(() => fetchMock.mockReset());
  const ctx = { tenantId: "t1", dealerId: "d1", organizationUnitId: null };
  const vehicle = { ...VEHICLE_FORM_EMPTY, make: "Toyota", model: "Corolla", year: "2020" };

  it("envia POST a /vehicles/purchase con Idempotency-Key y el cuerpo completo", async () => {
    fetchMock.mockResolvedValue({ ok: true, status: 201, json: async () => ({ id: "v1" }) } as Response);
    await createVehiclePurchase(ctx, vehicle, valida({ engine_number: "M1" }), "ARS", "key-1");
    const [path, init] = fetchMock.mock.calls[0];
    expect(path).toBe("/api/v1/autos/tenants/t1/dealers/d1/vehicles/purchase");
    expect(init?.method).toBe("POST");
    expect((init?.headers as Record<string, string>)["Idempotency-Key"]).toBe("key-1");
    const body = JSON.parse(String(init?.body));
    expect(body).toMatchObject({ make: "Toyota", engine_number: "M1" });
    expect(body.purchase.amount).toBe("1000000");
  });

  it("lanza el error de la API cuando la respuesta no es ok", async () => {
    fetchMock.mockResolvedValue({ ok: false, status: 422, json: async () => ({ detail: "x" }) } as Response);
    await expect(createVehiclePurchase(ctx, vehicle, valida(), "ARS", "key-2")).rejects.toBeDefined();
  });

  it("no envia nada si la compra no valida", async () => {
    await expect(createVehiclePurchase(ctx, vehicle, valida({ cost: "" }), "ARS", "key-3")).rejects.toThrow();
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
