import { mapBackendVehicle } from "@/lib/api/vehicle-mapper";
import { priceStatus } from "@/lib/finance";
import { searchVehiclesConsumer } from "@/lib/api/vehicles";
import type { FilterState } from "@/lib/search-types";
import type { Vehicle as BackendVehicle } from "@/types/autos";

jest.mock("@/lib/autos-consumer-api", () => ({ autosFetch: jest.fn() }));
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { autosFetch } = require("@/lib/autos-consumer-api") as { autosFetch: jest.Mock };

const base = {
  id: "7c9e6679-7425-40de-944b-e07fc1f90ae7",
  tenant_id: "t",
  dealer_id: "d",
  make: "Toyota",
  model: "Hilux",
  year: 2021,
  vin: "9BR53ZEC1M1234567",
  condition: "used",
} as BackendVehicle;

describe("F4A-5 mapper: precio real", () => {
  it("usa price_amount y price_currency (ARS 25.000.000)", () => {
    const v = mapBackendVehicle({ ...base, price_amount: 25_000_000, price_currency: "ARS" } as BackendVehicle);
    expect(v.price).toBe(25_000_000);
    expect(v.currency).toBe("ARS");
  });

  it("price_amount manda sobre price_rd", () => {
    const v = mapBackendVehicle({ ...base, price_rd: 1_000_000, price_amount: 25_000_000, price_currency: "ARS" } as BackendVehicle);
    expect(v.price).toBe(25_000_000);
  });

  it("sin precio real: 0 y sin moneda, nunca 1.000.000", () => {
    const v = mapBackendVehicle(base);
    expect(v.price).toBe(0);
    expect(v.currency).toBeUndefined();
  });

  it("no inventa match ni badge", () => {
    const v = mapBackendVehicle(base);
    expect(v.match).toBeUndefined();
    expect(v.badge).toBeUndefined();
  });

  it("sin badge ni match no hay estado de precio inventado", () => {
    expect(priceStatus(undefined, undefined)).toBeNull();
  });
});

describe("F4A-5 busqueda sin resultados", () => {
  const state = { query: "", brands: [], types: [], fuels: [], trans: [], provinces: [], pageSize: 20, sort: "relevance" } as unknown as FilterState;

  it("0 resultados -> lista vacia, sin coches de demostracion", async () => {
    autosFetch.mockResolvedValueOnce({ vehicles: [], total: 0 });
    const r = await searchVehiclesConsumer(state);
    expect(r.vehicles).toEqual([]);
    expect(r.total).toBe(0);
  });

  it("error de red -> lista vacia", async () => {
    const warn = jest.spyOn(console, "warn").mockImplementation(() => {});
    autosFetch.mockRejectedValueOnce(new Error("down"));
    const r = await searchVehiclesConsumer(state);
    warn.mockRestore();
    expect(r.vehicles).toEqual([]);
  });
});
