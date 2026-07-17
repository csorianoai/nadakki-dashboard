"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { Car, type LucideIcon } from "lucide-react";
import { BODY_TYPE_TILES } from "@/lib/vehicles";
import { cn } from "@/lib/utils";

const FALLBACK_ICONS: Record<string, LucideIcon> = {
  suv: Car,
  sedan: Car,
  pickup: Car,
  minivan: Car,
  coupe: Car,
  hatchback: Car,
  convertible: Car,
  luxury: Car,
};

function BodyTypeTile({
  tile,
}: {
  tile: (typeof BODY_TYPE_TILES)[number];
}) {
  const [failed, setFailed] = useState(false);
  const Icon = FALLBACK_ICONS[tile.slug] ?? Car;

  return (
    <Link
      href={`/autos/vehiculos?types=${encodeURIComponent(tile.tipo)}`}
      className={cn(
        "body-type-tile group flex min-h-[44px] cursor-pointer flex-col items-center gap-2 rounded-xl px-2 py-4 transition duration-200",
        "hover:-translate-y-0.5 hover:bg-nk-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2",
      )}
    >
      <div className="body-type-image-wrapper relative flex aspect-[3/2] w-full items-center justify-center">
        {!failed ? (
          <Image
            src={tile.image}
            alt={tile.label}
            width={400}
            height={267}
            className="max-h-full max-w-full object-contain [filter:grayscale(0.1)] transition duration-300 group-hover:scale-[1.03]"
            sizes="(max-width: 640px) 45vw, 140px"
            onError={() => setFailed(true)}
          />
        ) : (
          <div className="body-type-fallback flex h-full w-full items-center justify-center rounded-xl bg-brand-soft">
            <Icon className="h-16 w-16 text-brand" aria-hidden />
          </div>
        )}
      </div>
      <p className="body-type-label text-center font-manrope text-sm font-semibold text-nk-fg">
        {tile.label}
      </p>
      <span className="body-type-count text-xs text-nk-fg-muted">{tile.count} disponibles</span>
    </Link>
  );
}

export function BodyTypeGrid() {
  return (
    <section id="tipos" className="bg-nk-surface-2 px-[clamp(16px,3vw,22px)] py-10">
      <div className="mx-auto max-w-[1440px]">
        <h2 className="font-manrope text-[clamp(22px,3vw,30px)] font-bold text-nk-fg">
          Explora por tipo
        </h2>
        <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-8">
          {BODY_TYPE_TILES.map((tile) => (
            <BodyTypeTile key={tile.slug} tile={tile} />
          ))}
        </div>
      </div>
    </section>
  );
}
