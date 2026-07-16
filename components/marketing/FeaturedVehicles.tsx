"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { VehicleCard } from "@/components/vehicle/VehicleCard";
import { VEHICLES_SEED } from "@/lib/vehicles";

export function FeaturedVehicles() {
  const featured = VEHICLES_SEED.slice(0, 8);
  const [saved, setSaved] = useState<Set<number>>(new Set());

  const toggleSave = (id: number) => {
    setSaved((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <section id="destacados" className="px-[22px] py-10">
      <div className="mx-auto max-w-[1440px]">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="font-manrope text-[clamp(22px,3vw,30px)] font-bold text-nk-fg">
              Vehículos destacados
            </h2>
            <p className="mt-1 text-sm text-nk-fg-muted">
              Seleccionados por match score y precio verificado
            </p>
          </div>
          <Button variant="outline" className="gap-2" asChild>
            <Link href="/autos/vehiculos">
              Ver todo el inventario
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {featured.map((vehicle) => (
            <VehicleCard
              key={vehicle.id}
              vehicle={vehicle}
              saved={saved.has(vehicle.id)}
              onSaveToggle={() => toggleSave(vehicle.id)}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
