"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";

const POPULAR_BRANDS = [
  { name: "Toyota", mark: "T" },
  { name: "Honda", mark: "H" },
  { name: "Hyundai", mark: "Hy" },
  { name: "Kia", mark: "K" },
  { name: "Ford", mark: "F" },
  { name: "Chevrolet", mark: "C" },
  { name: "Mercedes-Benz", mark: "MB" },
  { name: "BMW", mark: "BMW" },
] as const;

export function PopularBrands() {
  return (
    <section id="marcas" className="px-[22px] py-10">
      <div className="mx-auto max-w-[1440px]">
        <h2 className="font-manrope text-[clamp(22px,3vw,30px)] font-bold text-nk-fg">
          Descubre marcas populares
        </h2>
        <p className="mt-1 text-sm text-nk-fg-muted">Las más buscadas en RD</p>

        <div className="mt-5 grid grid-cols-4 gap-3 md:grid-cols-[repeat(auto-fit,minmax(120px,1fr))]">
          {POPULAR_BRANDS.map((brand) => (
            <Link
              key={brand.name}
              href={`/autos/vehiculos?marca=${encodeURIComponent(brand.name)}`}
              className={cn(
                "flex aspect-square flex-col items-center justify-center rounded-r border border-nk-border bg-nk-surface p-5 transition duration-200",
                "hover:scale-[1.03] hover:border-brand hover:shadow-nk-md",
              )}
            >
              <span
                className={cn(
                  "font-manrope text-[clamp(28px,6vw,40px)] font-extrabold leading-none text-nk-fg",
                  "dark:invert",
                )}
                aria-hidden
              >
                {brand.mark}
              </span>
              <span className="mt-3 text-center text-sm font-medium text-nk-fg-muted">
                {brand.name}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
