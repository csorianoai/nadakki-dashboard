"use client";

import Link from "next/link";
import Image from "next/image";
import { BODY_TYPE_TILES } from "@/lib/vehicles";
import { cn } from "@/lib/utils";

export function BodyTypeGrid() {
  return (
    <section id="tipos" className="bg-nk-surface-2 px-[22px] py-10">
      <div className="mx-auto max-w-[1440px]">
        <h2 className="font-manrope text-[clamp(22px,3vw,30px)] font-bold text-nk-fg">
          Explora por tipo
        </h2>
        <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-8">
          {BODY_TYPE_TILES.map((tile) => (
            <Link
              key={tile.slug}
              href={`/autos/vehiculos?types=${encodeURIComponent(tile.tipo)}`}
              className={cn(
                "body-type-tile group flex flex-col items-center gap-2 rounded-xl p-3 transition duration-200",
                "hover:-translate-y-0.5 hover:bg-nk-surface",
              )}
            >
              <div className="relative flex aspect-[4/3] w-full items-center justify-center">
                <Image
                  src={tile.image}
                  alt={tile.label}
                  width={400}
                  height={300}
                  sizes="(max-width: 640px) 45vw, 140px"
                  className="max-h-full max-w-[90%] object-contain transition duration-300 group-hover:scale-[1.03]"
                />
              </div>
              <div className="text-center">
                <p className="font-manrope text-sm font-medium text-nk-fg">{tile.label}</p>
                <span className="text-xs text-nk-fg-muted">{tile.count} disponibles</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
