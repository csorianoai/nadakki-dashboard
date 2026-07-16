"use client";

import Link from "next/link";
import Image from "next/image";
import { BODY_TYPES } from "@/lib/vehicles";
import { cn } from "@/lib/utils";

const BODY_TYPE_IMAGES: Record<string, string> = {
  yipeta: "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=400&auto=format&fit=crop",
  sedan: "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=400&auto=format&fit=crop",
  camioneta: "https://images.unsplash.com/photo-1567333720967-45e0d4e5ff4c?w=400&auto=format&fit=crop",
  guagua: "https://images.unsplash.com/photo-1618767689160-da3fb810aad7?w=400&auto=format&fit=crop",
  deportivo: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=400&auto=format&fit=crop",
  compacto: "https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?w=400&auto=format&fit=crop",
  convertible: "https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=400&auto=format&fit=crop",
  lujo: "https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=400&auto=format&fit=crop",
};

export function BodyTypeGrid() {
  return (
    <section id="tipos" className="px-[22px] py-10">
      <div className="mx-auto max-w-[1440px]">
        <h2 className="font-manrope text-[clamp(22px,3vw,30px)] font-bold text-nk-fg">
          Explora por tipo
        </h2>
        <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-[repeat(auto-fill,minmax(150px,1fr))]">
          {BODY_TYPES.map((tile) => (
            <Link
              key={tile.key}
              href={`/autos/vehiculos?types=${encodeURIComponent(tile.tipo)}`}
              className={cn(
                "group overflow-hidden rounded-r border border-nk-border bg-nk-surface shadow-nk-sm transition duration-200",
                "hover:scale-[1.03] hover:border-brand hover:shadow-nk-md",
              )}
            >
              <div className="relative aspect-[4/3] overflow-hidden">
                <Image
                  src={BODY_TYPE_IMAGES[tile.key]!}
                  alt={tile.label}
                  fill
                  sizes="(max-width: 768px) 50vw, 200px"
                  className="object-cover transition duration-300 group-hover:scale-105"
                />
                <div
                  className="absolute inset-0 bg-brand-soft/25 mix-blend-multiply dark:mix-blend-soft-light"
                  aria-hidden
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
