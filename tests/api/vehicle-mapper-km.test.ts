/** Cowork 26-nov: con mileage_km null la tarjeta publica decia "0 km". El mapper marca el dato como desconocido. */
import { kmTexto } from "@/components/vehicle/km";
import { mapBackendVehicle } from "@/lib/api/vehicle-mapper";
import type { Vehicle as BackendVehicle } from "@/types/autos";

const base = { id: "v1", make: "Toyota", model: "RAV4", year: 2021, price_amount: 100, price_currency: "ARS" };

describe("mapBackendVehicle: kilometraje", () => {
  it("null o ausente queda desconocido", () => {
    for (const mileage_km of [null, undefined]) {
      const v = mapBackendVehicle({ ...base, mileage_km } as unknown as BackendVehicle);
      expect(v.kmDesconocido).toBe(true);
      expect(v.km).toBe(0);
    }
  });
  it("un valor, incluso 0, es real", () => {
    expect(mapBackendVehicle({ ...base, mileage_km: 0 } as unknown as BackendVehicle).kmDesconocido).toBeUndefined();
    const v = mapBackendVehicle({ ...base, mileage_km: 38400 } as unknown as BackendVehicle);
    expect(v).toMatchObject({ km: 38400 });
    expect(v.kmDesconocido).toBeUndefined();
  });
  it("lo que muestran tarjeta y ficha (kmTexto): nada si es desconocido, el km real si no", () => {
    expect(kmTexto(mapBackendVehicle({ ...base, mileage_km: null } as unknown as BackendVehicle))).toBeNull();
    expect(kmTexto(mapBackendVehicle({ ...base, mileage_km: 0 } as unknown as BackendVehicle))).toMatch(/^0\s?km$/);
    expect(kmTexto(mapBackendVehicle({ ...base, mileage_km: 38400 } as unknown as BackendVehicle))).toMatch(/38[.,\s]?400/);
  });
});
