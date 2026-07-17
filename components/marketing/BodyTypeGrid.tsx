"use client";

import Link from "next/link";
import {
  Bus,
  Car,
  CarFront,
  Gem,
  Gauge,
  Sun,
  Truck,
  type LucideIcon,
} from "lucide-react";
import { BODY_TYPE_TILES } from "@/lib/vehicles";
import { cn } from "@/lib/utils";

const TYPE_ICONS: Record<string, LucideIcon> = {
  suv: Car,
  sedan: CarFront,
  pickup: Truck,
  minivan: Bus,
  coupe: Gauge,
  hatchback: CarFront,
  convertible: Sun,
  luxury: Gem,
};

export function BodyTypeGrid() {
  return (
    <section id="tipos" className="bg-nk-surface-2 px-[clamp(16px,3vw,22px)] py-10">
      <div className="mx-auto max-w-[1440px]">
        <h2 className="font-manrope text-[clamp(22px,3vw,30px)] font-bold text-nk-fg">
          Explora por tipo
        </h2>
        <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-8">
          {BODY_TYPE_TILES.map((tile) => {
            const Icon = TYPE_ICONS[tile.slug] ?? Car;
            return (
              <Link
                key={tile.slug}
                href={`/autos/vehiculos?types=${encodeURIComponent(tile.tipo)}`}
                className={cn(
                  "body-type-tile group flex min-h-[44px] flex-col items-center gap-2 rounded-xl p-3 transition duration-200",
                  "hover:-translate-y-0.5 hover:bg-nk-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2",
                )}
              >
                <div className="flex aspect-[4/3] w-full items-center justify-center rounded-xl bg-brand-soft">
                  <Icon className="h-10 w-10 text-brand transition group-hover:scale-105" aria-hidden />
                </div>
                <div className="text-center">
                  <p className="font-manrope text-sm font-medium text-nk-fg">{tile.label}</p>
                  <span className="text-xs text-nk-fg-muted">{tile.count} disponibles</span>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
