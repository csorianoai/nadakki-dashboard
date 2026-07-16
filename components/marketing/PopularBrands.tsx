"use client";

import Link from "next/link";
import Image from "next/image";
import { useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

type BrandCard = {
  name: string;
  logo: string;
  width: number;
  height: number;
  unoptimized?: boolean;
};

export const POPULAR_BRAND_CARDS: BrandCard[] = [
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
  {
    name: "Nissan",
    logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8c/Nissan_logo.svg/120px-Nissan_logo.svg.png",
    width: 120,
    height: 48,
  },
  {
    name: "Mazda",
    logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/44/Mazda_logo_%28North_America%29.svg/120px-Mazda_logo_%28North_America%29.svg.png",
    width: 120,
    height: 48,
  },
  {
    name: "Suzuki",
    logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/12/Suzuki_logo_2.svg/120px-Suzuki_logo_2.svg.png",
    width: 120,
    height: 48,
  },
  {
    name: "Mitsubishi",
    logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5a/Mitsubishi_Motors_logo.svg/120px-Mitsubishi_Motors_logo.svg.png",
    width: 120,
    height: 48,
  },
  {
    name: "Volkswagen",
    logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6d/Volkswagen_logo_2019.svg/120px-Volkswagen_logo_2019.svg.png",
    width: 120,
    height: 48,
  },
  {
    name: "Lexus",
    logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d1/Lexus_division_emblem.svg/120px-Lexus_division_emblem.svg.png",
    width: 120,
    height: 48,
  },
  {
    name: "Audi",
    logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/92/Audi-Logo_2016.svg/120px-Audi-Logo_2016.svg.png",
    width: 120,
    height: 48,
  },
  {
    name: "Jeep",
    logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7e/Jeep_logo.svg/120px-Jeep_logo.svg.png",
    width: 120,
    height: 48,
  },
];

function BrandCardLink({ brand, className }: { brand: BrandCard; className?: string }) {
  return (
    <Link
      href={`/autos/vehiculos?marca=${encodeURIComponent(brand.name)}`}
      className={cn(
        "brand-card flex shrink-0 snap-start flex-col items-center justify-center rounded-[20px] border border-nk-border bg-nk-surface px-4 py-6 transition duration-200",
        "hover:scale-[1.03] hover:border-brand hover:shadow-nk-md",
        className,
      )}
    >
      <Image
        src={brand.logo}
        alt={`Logo ${brand.name}`}
        width={brand.width}
        height={brand.height}
        unoptimized={brand.unoptimized}
        className="max-h-[60px] w-auto object-contain"
      />
      <span className="mt-3 text-center font-manrope text-sm font-medium text-nk-fg">
        {brand.name}
      </span>
    </Link>
  );
}

export function PopularBrands() {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scrollBy = (delta: number) => {
    scrollRef.current?.scrollBy({ left: delta, behavior: "smooth" });
  };

  return (
    <section id="marcas" className="px-[22px] py-10">
      <div className="mx-auto max-w-[1440px]">
        <h2 className="font-manrope text-[clamp(22px,3vw,30px)] font-bold text-nk-fg">
          Descubre marcas populares
        </h2>
        <p className="mt-1 text-sm text-nk-fg-muted">Las más buscadas en RD</p>

        {/* Desktop — horizontal scroll */}
        <div className="group/brands relative mt-5 hidden lg:block">
          <button
            type="button"
            onClick={() => scrollBy(-680)}
            className="absolute -left-3 top-1/2 z-10 hidden -translate-y-1/2 rounded-full border border-nk-border bg-nk-surface p-2 shadow-nk-md opacity-0 transition hover:border-brand group-hover/brands:opacity-100 lg:flex"
            aria-label="Marcas anteriores"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={() => scrollBy(680)}
            className="absolute -right-3 top-1/2 z-10 hidden -translate-y-1/2 rounded-full border border-nk-border bg-nk-surface p-2 shadow-nk-md opacity-0 transition hover:border-brand group-hover/brands:opacity-100 lg:flex"
            aria-label="Marcas siguientes"
          >
            <ChevronRight className="h-5 w-5" />
          </button>

          <div
            ref={scrollRef}
            className="brands-container group/brands flex gap-3 overflow-x-auto scroll-smooth pb-2 [scroll-snap-type:x_mandatory] [-webkit-overflow-scrolling:touch]"
          >
            {POPULAR_BRAND_CARDS.map((brand) => (
              <BrandCardLink key={brand.name} brand={brand} className="h-[160px] w-[160px]" />
            ))}
          </div>
        </div>

        {/* Mobile / tablet — 4x4 grid */}
        <div className="mt-5 grid grid-cols-4 gap-3 lg:hidden">
          {POPULAR_BRAND_CARDS.map((brand) => (
            <BrandCardLink key={brand.name} brand={brand} className="aspect-square" />
          ))}
        </div>

        <Link
          href="/autos/vehiculos"
          className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-brand hover:underline"
        >
          Ver todas las marcas →
        </Link>
      </div>
    </section>
  );
}
