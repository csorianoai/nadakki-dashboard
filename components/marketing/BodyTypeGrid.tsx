"use client";

import Link from "next/link";
import Image from "next/image";
import { BODY_TYPE_TILES } from "@/lib/vehicles";
import { cn } from "@/lib/utils";

export function BodyTypeGrid() {
  return (
    <section id="tipos" className="px-[22px] py-10">
      <div className="mx-auto max-w-[1440px]">
        <h2 className="font-manrope text-[clamp(22px,3vw,30px)] font-bold text-nk-fg">
          Explora por tipo
        </h2>
        <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-[repeat(auto-fill,minmax(150px,1fr))]">
          {BODY_TYPE_TILES.map((tile) => (
            <Link
              key={tile.slug}
              href={`/autos/vehiculos?types=${encodeURIComponent(tile.tipo)}`}
              className={cn(
                "group overflow-hidden rounded-r border border-nk-border bg-nk-surface shadow-nk-sm transition duration-200",
                "hover:scale-[1.03] hover:border-brand hover:shadow-nk-md",
              )}
            >
              <div
                className="relative aspect-[4/3] overflow-hidden"
                style={{
                  background:
                    "linear-gradient(180deg, var(--surface-2) 0%, var(--surface) 55%, var(--brand-soft) 100%)",
                }}
              >
                <Image
                  src={tile.image}
                  alt={tile.label}
                  fill
                  sizes="(max-width: 768px) 50vw, 200px"
                  className="object-contain p-2 transition duration-300 group-hover:scale-[1.03]"
                />
              </div>
              <div className="px-3 py-3 text-center">
                <span className="block text-sm font-semibold text-nk-fg">{tile.label}</span>
                <span className="mt-0.5 block text-xs tabular-nums text-nk-fg-subtle">
                  {tile.count}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
