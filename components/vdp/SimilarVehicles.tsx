import { VehicleCard } from "@/components/vehicle/VehicleCard";
import { VEHICLES_SEED, type Vehicle } from "@/lib/vehicles";

export function SimilarVehicles({ vehicle }: { vehicle: Vehicle }) {
  const similar = VEHICLES_SEED.filter(
    (v) => v.id !== vehicle.id && v.type === vehicle.type && v.loc === vehicle.loc,
  ).slice(0, 3);

  const fallback =
    similar.length >= 3
      ? similar
      : VEHICLES_SEED.filter((v) => v.id !== vehicle.id && v.type === vehicle.type).slice(0, 3);

  return (
    <section className="mt-8">
      <h2 className="mb-4 font-manrope text-xl font-bold text-nk-fg">Vehículos similares</h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {fallback.map((v) => (
          <VehicleCard key={v.id} vehicle={v} variant="compact" />
        ))}
      </div>
    </section>
  );
}
