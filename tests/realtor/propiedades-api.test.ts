jest.mock("@/lib/api/fetch-client", () => ({ apiFetch: jest.fn(), getAuthHeaders: () => ({}) }));

import { mapProperties } from "@/lib/realtor/propiedades/api";

const PID = "00000000-0000-4000-8000-00000000e001";
const prop = { id: PID, address: { country: "US", region: "SYNTH-REGION", city: "SYNTH City" }, property_type: "condo" };
const listing = { id: "l1", property_id: PID, status: "pending", list_price: { amount: "1800.50", currency: "USD" }, active_stage: "acuerdo" };

describe("mapProperties (C-RE-OLA2)", () => {
  it("une propiedad y listing y traduce enums", () => {
    expect(mapProperties([prop], [listing])).toEqual([
      { id: "l1", address: "SYNTH City, SYNTH-REGION", type: "condominio", status: "en_contrato", stage: "agreement", price: { amount: 1800.5, currency: "USD" }, units: [] },
    ]);
  });
  it("sin etapa activa la etapa es null", () => {
    expect(mapProperties([prop], [{ ...listing, active_stage: null }])[0].stage).toBeNull();
  });
  it("descarta filas inválidas o sin propiedad, nunca inventa", () => {
    expect(mapProperties([prop], [{ ...listing, property_id: "otra" }, { ...listing, status: "x" }, { ...listing, list_price: null }, 5])).toEqual([]);
    expect(mapProperties([], [])).toEqual([]);
  });
});
