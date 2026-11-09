import { mapBackendVehicle } from "@/lib/api/vehicle-mapper";
import { primaryPhotoUrl, vehiclePhotoUrls } from "@/lib/vehicles";
import type { Vehicle as BackendVehicle } from "@/types/autos";

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

const A = "https://media.nadakki.com/vehicles/t/v/a.jpg";
const B = "https://media.nadakki.com/vehicles/t/v/b.jpg";

describe("P4 mapper: fotos reales del backend", () => {
  it("busqueda: primary_photo_url llega al Vehicle de consumo", () => {
    const v = mapBackendVehicle({ ...base, primary_photo_url: A });
    expect(v.primary_photo_url).toBe(A);
    expect(primaryPhotoUrl(v)).toBe(A);
  });

  it("ficha: photos mapea cdn_url y display_order->position, en orden", () => {
    const v = mapBackendVehicle({
      ...base,
      primary_photo_url: A,
      photos: [
        { cdn_url: B, thumbnail_url: null, medium_url: null, display_order: 1, is_primary: false },
        { cdn_url: A, thumbnail_url: null, medium_url: null, display_order: 0, is_primary: true },
      ],
    });
    expect(v.photos).toEqual([
      { cdn_url: B, position: 1 },
      { cdn_url: A, position: 0 },
    ]);
    expect(vehiclePhotoUrls(v)).toEqual([A, B]);
  });

  it("sin fotos: nada inventado (sin claves, el degradado sigue)", () => {
    const v = mapBackendVehicle({ ...base, primary_photo_url: null, photos: [] });
    expect(v.primary_photo_url).toBeUndefined();
    expect(v.photos).toBeUndefined();
    expect(vehiclePhotoUrls(v)).toEqual([]);
  });

  it("campos ausentes del backend: igual que sin fotos", () => {
    const v = mapBackendVehicle(base);
    expect("primary_photo_url" in v).toBe(false);
    expect("photos" in v).toBe(false);
  });

  it("descarta URLs que no son http(s) y entradas rotas", () => {
    const v = mapBackendVehicle({
      ...base,
      primary_photo_url: "javascript:alert(1)",
      photos: [
        { cdn_url: "javascript:alert(1)", display_order: 0 },
        { cdn_url: "vehicles/t/v/x.jpg", display_order: 1 },
        null,
        { cdn_url: A, display_order: "x" },
      ],
    });
    expect(v.primary_photo_url).toBeUndefined();
    expect(v.photos).toEqual([{ cdn_url: A, position: null }]);
  });

  it("no filtra storage_key ni tenant_id de la foto", () => {
    const v = mapBackendVehicle({
      ...base,
      photos: [{ cdn_url: A, display_order: 0, storage_key: "vehicles/t/v/a.jpg", tenant_id: "t" } as never],
    });
    expect(JSON.stringify(v.photos)).not.toMatch(/storage_key|tenant_id/);
  });
});
