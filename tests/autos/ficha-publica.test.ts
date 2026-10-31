import { mapBackendVehicle } from "@/lib/api/vehicle-mapper";
import { formatPrecioPublico, SIN_PRECIO } from "@/lib/autos-portal/moneda-publica";
import { publicVehicleHref } from "@/lib/autos-portal/vehicle-href";
import type { Vehicle as BackendVehicle } from "@/types/autos";

const UUID = "7c9e6679-7425-40de-944b-e07fc1f90ae7";
const backend: BackendVehicle = {
  id: UUID,
  tenant_id: "t",
  dealer_id: "d",
  make: "Toyota",
  model: "Hilux",
  year: 2021,
  vin: "9BR53ZEC1M1234567",
  condition: "used",
  price_rd: 45_000_000,
  mileage_km: 30_000,
};

describe("ficha publica sin datos inventados", () => {
  it("el precio sale del propio vehiculo, sin semilla ni valor por defecto", () => {
    expect(mapBackendVehicle(backend).price).toBe(45_000_000);
    expect(mapBackendVehicle({ ...backend, price_rd: null }).price).toBe(0);
  });

  it("no inventa vendedor, valoraciones ni tiempo de respuesta", () => {
    const v = mapBackendVehicle(backend);
    expect(v.dealerName).toBeUndefined();
    expect(v.rating).toBeUndefined();
    expect(v.reviews).toBeUndefined();
    expect(v.avgResp).toBeUndefined();
  });

  it("no expone VIN/chasis/motor en el modelo de consumidor", () => {
    expect(JSON.stringify(mapBackendVehicle(backend))).not.toContain(backend.vin as string);
  });

  it("el enlace abre el mismo vehiculo (id real, no una semilla)", () => {
    const v = mapBackendVehicle(backend);
    expect(publicVehicleHref(v)).toBe(`/autos/vehiculo/${UUID}`);
  });

  it("la moneda es la del tenant; sin moneda no se inventa", () => {
    const ars = formatPrecioPublico(45_000_000, { locale: "es-AR", currency: "ARS" });
    expect(ars).toContain("45.000.000");
    expect(ars).not.toContain("RD");
    expect(formatPrecioPublico(45_000_000, { locale: "es", currency: null })).toBe(SIN_PRECIO);
    expect(formatPrecioPublico(0, { locale: "es-AR", currency: "ARS" })).toBe(SIN_PRECIO);
  });
});
