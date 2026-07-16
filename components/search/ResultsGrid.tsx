"use client";

import { useState } from "react";
import { VehicleCard } from "@/components/vehicle/VehicleCard";
import { VehicleCardSkeleton } from "@/components/vehicle/VehicleCardSkeleton";
import type { Vehicle } from "@/lib/vehicles";

export function ResultsGrid({
  vehicles,
  loading,
}: {
  vehicles: Vehicle[];
  loading: boolean;
}) {
  const [saved, setSaved] = useState<Set<number>>(new Set());

  if (loading) {
    return (
      <div className="grid grid-cols-[repeat(auto-fill,minmax(250px,1fr))] gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <VehicleCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(250px,1fr))] gap-4">
      {vehicles.map((vehicle) => (
        <VehicleCard
          key={vehicle.id}
          vehicle={vehicle}
          saved={saved.has(vehicle.id)}
          onSaveToggle={() =>
            setSaved((prev) => {
              const next = new Set(prev);
              if (next.has(vehicle.id)) next.delete(vehicle.id);
              else next.add(vehicle.id);
              return next;
            })
          }
        />
      ))}
    </div>
  );
}
