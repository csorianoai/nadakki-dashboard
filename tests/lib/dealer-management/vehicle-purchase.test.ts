import { emptyPurchase, emptyPayment, validatePurchase, purchasePayload, createVehiclePurchase } from "@/lib/dealer-management/vehicle-purchase";
import { VEHICLE_FORM_EMPTY } from "@/lib/dealer-management/vehicle-manual";
import { apiFetch } from "@/lib/api/fetch-client";
jest.mock("@/lib/api/fetch-client", () => ({ apiFetch: jest.fn() }));
const good = () => ({ ...emptyPurchase(), amount: "0,30", currency: "ARS", acquired_at: "2026-11-01", country_code: "AR", acquisition_mode_code: "stock_inicial", seller_contact_id: "11111111-1111-4111-8111-111111111111", payments: [{ ...emptyPayment(), amount: "0,10" }, { ...emptyPayment(), amount: "0,20" }] });
test("suma decimal exacta y fecha sin conversión local", () => { expect(validatePurchase(good())).toEqual([]); expect(purchasePayload(good()).acquired_at).toBe("2026-11-01"); });
test.each([
  ["sin costo", () => ({ ...good(), amount: "" }), /costo/],
  ["suma incorrecta", () => ({ ...good(), amount: "1" }), /suma/],
  ["cheque sin fecha", () => ({ ...good(), payments: [{ ...emptyPayment(), method: "cheque", amount: "0,30" }] }), /fecha de cobro/],
  ["otra sin detalle", () => ({ ...good(), fx_rate: "1", fx_source: "otra", fx_as_of: "2026-11-01" }), /detalle/],
  ["sin contacto", () => ({ ...good(), seller_contact_id: "" }), /vendedor/],
] as const)("bloquea %s antes de HTTP", async (_, make, message) => {
  jest.clearAllMocks(); await expect(createVehiclePurchase({ tenantId: "t", dealerId: "d", organizationUnitId: null }, VEHICLE_FORM_EMPTY, make())).rejects.toThrow(message);
  expect(apiFetch).not.toHaveBeenCalled();
});
test("POST atómico usa contrato real y no reintenta ni crea contacto", async () => {
  jest.clearAllMocks(); (apiFetch as jest.Mock).mockResolvedValue({ ok: true, json: async () => ({ vehicle_id: "v" }) });
  await createVehiclePurchase({ tenantId: "t", dealerId: "d", organizationUnitId: null }, { ...VEHICLE_FORM_EMPTY, make: "Toyota", model: "Hilux", year: "2021" }, good());
  expect(apiFetch).toHaveBeenCalledTimes(1);
  const [url, init] = (apiFetch as jest.Mock).mock.calls[0]; expect(url).toMatch(/vehicles\/purchase$/);
  expect(JSON.parse(init.body).purchase.payments[1].amount).toBe("0.20");
  expect(init.headers).toBeUndefined();
});
