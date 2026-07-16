"use client";

import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";

const BRANDS = [
  {
    name: "Toyota",
    logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9d/Toyota_carlogo.svg/120px-Toyota_carlogo.svg.png",
    width: 120,
    height: 48,
  },
  {
    name: "Honda",
    logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/38/Honda.svg/120px-Honda.svg.png",
    width: 120,
    height: 48,
  },
  {
    name: "Hyundai",
    logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/44/Hyundai_Motor_Company_logo.svg/120px-Hyundai_Motor_Company_logo.svg.png",
    width: 120,
    height: 48,
  },
  {
    name: "Kia",
    logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b6/KIA_logo3.svg/120px-KIA_logo3.svg.png",
    width: 120,
    height: 48,
  },
  {
    name: "Ford",
    logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3e/Ford_logo_flat.svg/120px-Ford_logo_flat.svg.png",
    width: 120,
    height: 48,
  },
  {
    name: "Chevrolet",
    logo: "/assets/brands/chevrolet.svg",
    width: 60,
    height: 60,
    unoptimized: true,
  },
  {
    name: "Mercedes-Benz",
    logo: "https://upload.wikimedia.org/wikipedia/commons/9/90/Mercedes-Logo.svg",
    width: 60,
    height: 60,
    unoptimized: true,
  },
  {
    name: "BMW",
    logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/44/BMW.svg/330px-BMW.svg.png",
    width: 80,
    height: 80,
  },
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
          {BRANDS.map((brand) => (
            <Link
              key={brand.name}
              href={`/autos/vehiculos?marca=${encodeURIComponent(brand.name)}`}
              className={cn(
                "flex aspect-square flex-col items-center justify-center rounded-[20px] border border-nk-border bg-nk-surface px-4 py-6 transition duration-200",
                "hover:scale-[1.03] hover:border-brand hover:shadow-nk-md",
              )}
            >
              <Image
                src={brand.logo}
                alt={`Logo ${brand.name}`}
                width={brand.width}
                height={brand.height}
                unoptimized={"unoptimized" in brand ? brand.unoptimized : false}
                className="max-h-[60px] w-auto object-contain"
              />
              <span className="mt-3 text-center font-manrope text-sm font-medium text-nk-fg">
                {brand.name}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
