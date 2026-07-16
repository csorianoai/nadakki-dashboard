"use client";

import Link from "next/link";
import {
  Bus,
  Car,
  CarFront,
  Crown,
  Sparkles,
  Truck,
  Zap,
} from "lucide-react";
import { BODY_TYPES } from "@/lib/vehicles";
import { cn } from "@/lib/utils";

const ICONS = [Truck, Car, Truck, Bus, Zap, CarFront, Sparkles, Crown] as const;

export function BodyTypeGrid() {
  return (
    <section id="tipos" className="px-[22px] py-10">
      <div className="mx-auto max-w-[1440px]">
        <h2 className="font-manrope text-[clamp(22px,3vw,30px)] font-bold text-nk-fg">
          Explora por tipo
        </h2>
        <div className="mt-5 grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))] gap-3">
          {BODY_TYPES.map((tile, index) => {
            const Icon = ICONS[index] ?? Car;
            return (
              <Link
                key={tile.key}
                href={`/autos/vehiculos?tipo=${encodeURIComponent(tile.tipo)}`}
                className={cn(
                  "group flex flex-col items-center gap-2 rounded-r border border-nk-border bg-nk-surface p-4 text-center shadow-nk-sm transition duration-200",
                  "hover:-translate-y-[3px] hover:border-brand hover:shadow-nk-md",
                )}
              >
                <Icon
                  className="h-10 w-10 text-nk-fg-muted transition group-hover:text-brand"
                  strokeWidth={1.7}
                  aria-hidden
                />
                <span className="text-sm font-semibold text-nk-fg">{tile.label}</span>
                <span className="text-xs tabular-nums text-nk-fg-subtle">{tile.count}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
