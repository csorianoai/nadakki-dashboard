"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Camera, Fuel, Gauge, Settings2, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { fmtKm, fmtRD } from "@/lib/format";
import { cuota, priceStatus } from "@/lib/finance";
import {
  getVehicleFallbackUrl,
  getVehicleImaginUrl,
} from "@/lib/vehicle-images";
import { photoCount, type Vehicle } from "@/lib/vehicles";
import { QualityBadge } from "@/components/vehicle/QualityBadge";
import { PrecioJustoBadge } from "@/components/vehicle/PrecioJustoBadge";
import { SaveButton } from "@/components/vehicle/SaveButton";
import { cn } from "@/lib/utils";

function dealerInitials(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

type ImageStage = "imagin" | "fallback" | "gradient";

function VehicleCardImage({ vehicle }: { vehicle: Vehicle }) {
  const [stage, setStage] = useState<ImageStage>("imagin");

  const alt = `${vehicle.year} ${vehicle.make} ${vehicle.model}`;

  if (stage === "gradient") {
    return (
      <div
        className="aspect-[16/10] w-full"
        style={{ background: vehicle.grad }}
        aria-hidden
      />
    );
  }

  const src =
    stage === "imagin" ? getVehicleImaginUrl(vehicle) : getVehicleFallbackUrl(vehicle);

  if (!src) {
    return (
      <div
        className="aspect-[16/10] w-full"
        style={{ background: vehicle.grad }}
        aria-hidden
      />
    );
  }

  return (
    <div className="relative aspect-[16/10] w-full overflow-hidden bg-nk-surface-2">
      <Image
        src={src}
        alt={alt}
        fill
        className="object-cover"
        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        onError={() => {
          if (stage === "imagin" && getVehicleFallbackUrl(vehicle)) {
            setStage("fallback");
          } else {
            setStage("gradient");
          }
        }}
      />
    </div>
  );
}

export function VehicleCard({
  vehicle,
  saved = false,
  onSaveToggle,
  className,
  variant = "default",
}: {
  vehicle: Vehicle;
  saved?: boolean;
  onSaveToggle?: () => void;
  className?: string;
  variant?: "default" | "compact";
}) {
  const router = useRouter();
  const status = priceStatus(vehicle.badge, vehicle.match);
  const monthly = Math.round(cuota(vehicle.price, 20, 60));
  const href = `/autos/vehiculo/${vehicle.id}`;
  const photos = photoCount(vehicle.id);

  const navigate = () => router.push(href);

  if (variant === "compact") {
    return (
      <article
        data-vehicle-id={vehicle.id}
        role="link"
        tabIndex={0}
        onClick={navigate}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            navigate();
          }
        }}
        className={cn(
          "flex cursor-pointer gap-3 overflow-hidden rounded-r border border-nk-border bg-nk-surface p-3 shadow-nk-sm transition hover:-translate-y-0.5 hover:shadow-nk-md",
          className,
        )}
      >
        <div
          className="h-[72px] w-[96px] shrink-0 rounded-r-sm"
          style={{ background: vehicle.grad }}
          aria-hidden
        />
        <div className="min-w-0 flex-1">
          <h3 className="truncate font-manrope text-sm font-bold text-nk-fg">
            {vehicle.year} {vehicle.make} {vehicle.model}
          </h3>
          <p className="text-xs text-nk-fg-muted">{vehicle.loc}</p>
          <p className="mt-1 font-manrope text-sm font-extrabold tabular-nums text-brand">
            {fmtRD(monthly)}/mes
          </p>
        </div>
      </article>
    );
  }

  return (
    <article
      data-vehicle-id={vehicle.id}
      data-price-status={status}
      className={cn(
        "group flex flex-col overflow-hidden rounded-r border border-nk-border bg-nk-surface shadow-nk-sm transition duration-200 ease-out",
        "hover:-translate-y-[5px] hover:scale-[1.02] hover:shadow-nk-lg",
        className,
      )}
    >
      <div
        role="link"
        tabIndex={0}
        onClick={navigate}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            navigate();
          }
        }}
        className="relative cursor-pointer"
      >
        <VehicleCardImage vehicle={vehicle} />
        <QualityBadge status={status} className="absolute left-3 top-3" />
        <div className="absolute right-3 top-3">
          <SaveButton
            saved={saved}
            onToggle={onSaveToggle ?? (() => undefined)}
          />
        </div>
        <span className="absolute bottom-3 right-3 inline-flex items-center gap-1 rounded-full bg-black/55 px-2 py-1 text-[10px] font-semibold text-white backdrop-blur-sm">
          <Camera className="h-3 w-3" aria-hidden />
          {photos}
        </span>
      </div>

      <div className="flex flex-1 flex-col gap-2.5 p-4">
        <div
          role="link"
          tabIndex={0}
          onClick={navigate}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              navigate();
            }
          }}
          className="cursor-pointer space-y-1.5"
        >
          <h3 className="font-manrope text-lg font-bold leading-snug text-nk-fg">
            {vehicle.year} {vehicle.make} {vehicle.model}
          </h3>
          <p className="text-xs font-medium uppercase tracking-[0.5px] text-nk-fg-subtle">
            {vehicle.featuresLine}
          </p>

          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-nk-fg-muted">
            <span className="inline-flex items-center gap-1">
              <Gauge className="h-3.5 w-3.5" aria-hidden />
              {fmtKm(vehicle.km)}
            </span>
            <span className="inline-flex items-center gap-1">
              <Settings2 className="h-3.5 w-3.5" aria-hidden />
              {vehicle.trans}
            </span>
            <span className="inline-flex items-center gap-1">
              <Fuel className="h-3.5 w-3.5" aria-hidden />
              {vehicle.fuel}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2 pt-0.5">
            <p className="font-manrope text-[22px] font-extrabold tabular-nums text-nk-fg">
              {fmtRD(vehicle.price)}
            </p>
            <QualityBadge status={status} />
          </div>

          <p className="text-sm font-semibold tabular-nums text-brand">
            {fmtRD(monthly)}/mes · 60 meses · 13.5% APR
          </p>
        </div>

        <div className="flex flex-wrap gap-1.5">
          <span className="rounded-full bg-brand-soft px-2 py-0.5 text-[10px] font-bold text-brand">
            {vehicle.match}% match
          </span>
          {(vehicle.id === 3 || vehicle.id === 7) && (
            <span className="rounded-full bg-blue-500/15 px-2 py-0.5 text-[10px] font-bold text-blue-600 dark:text-blue-400">
              Recién publicado
            </span>
          )}
          {vehicle.year >= 2023 && (
            <span className="rounded-full bg-violet-500/15 px-2 py-0.5 text-[10px] font-bold text-violet-600 dark:text-violet-400">
              Certificado Nadakki
            </span>
          )}
          <PrecioJustoBadge vehicle={vehicle} />
        </div>

        <div className="flex items-center gap-2 pt-1">
          <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-r-sm bg-nk-surface-2 text-[9px] font-bold text-nk-fg-muted">
            {dealerInitials(vehicle.dealerName)}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-semibold text-nk-fg">
              {vehicle.dealerName} | {vehicle.loc}
            </p>
            <p className="flex items-center gap-1 text-[11px] text-nk-fg-subtle">
              <Star className="h-3 w-3 fill-nk-warning text-nk-warning" aria-hidden />
              {vehicle.rating.toFixed(1)} ({vehicle.reviews} ventas)
            </p>
          </div>
        </div>

        <div className="mt-auto flex gap-2 pt-2">
          <Button variant="brand" className="min-h-10 flex-1 hover:brightness-110" asChild>
            <Link href={`${href}?financiar=1`} onClick={(e) => e.stopPropagation()}>
              Aplicar financiamiento
            </Link>
          </Button>
          <Button variant="outline" className="min-h-10 px-4" asChild>
            <Link href={href} onClick={(e) => e.stopPropagation()}>
              Ver
            </Link>
          </Button>
        </div>
      </div>
    </article>
  );
}
