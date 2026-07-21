"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { memo, useCallback } from "react";
import { Camera, Fuel, Gauge, MapPin, Settings2, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { fmtKm, fmtRD, fmtUS } from "@/lib/format";
import { cuota, priceStatus } from "@/lib/finance";
import { photoCount, type Vehicle } from "@/lib/vehicles";
import { QualityBadge } from "@/components/vehicle/QualityBadge";
import { PrecioJustoBadge } from "@/components/vehicle/PrecioJustoBadge";
import { SaveButton } from "@/components/vehicle/SaveButton";
import { cn } from "@/lib/utils";

export type VehicleCardVariant = "grid" | "list" | "compact";

function CardPhoto({
  vehicle,
  status,
  photos,
  saved,
  onSaveToggle,
  aspectClass,
}: {
  vehicle: Vehicle;
  status: ReturnType<typeof priceStatus>;
  photos: number;
  saved: boolean;
  onSaveToggle?: () => void;
  aspectClass: string;
}) {
  return (
    <div className={cn("relative overflow-hidden rounded-r-sm bg-nk-surface-2", aspectClass)}>
      <div
        className="absolute inset-0"
        style={{ background: vehicle.grad }}
        role="img"
        aria-label={`${vehicle.year} ${vehicle.make} ${vehicle.model}`}
      />
      <QualityBadge status={status} className="absolute left-2 top-2 md:left-3 md:top-3" />
      <div className="absolute right-2 top-2 md:right-3 md:top-3">
        <SaveButton saved={saved} onToggle={onSaveToggle ?? (() => undefined)} />
      </div>
      <span className="absolute bottom-2 right-2 inline-flex items-center gap-1 rounded-full bg-[color-mix(in_srgb,var(--fg)_55%,transparent)] px-2 py-0.5 text-[10px] font-semibold text-[var(--surface)] backdrop-blur-sm md:bottom-3 md:right-3">
        <Camera className="h-3 w-3" aria-hidden />
        {photos}
      </span>
    </div>
  );
}

export const VehicleCard = memo(function VehicleCard({
  vehicle,
  saved = false,
  onSaveToggle,
  className,
  variant = "list",
}: {
  vehicle: Vehicle;
  saved?: boolean;
  onSaveToggle?: () => void;
  className?: string;
  variant?: VehicleCardVariant;
}) {
  const router = useRouter();
  const status = priceStatus(vehicle.badge, vehicle.match);
  const monthly = Math.round(cuota(vehicle.price, 20, 60));
  const href = `/autos/vehiculo/${vehicle.id}`;
  const photos = photoCount(vehicle.id);

  const navigate = useCallback(() => router.push(href), [router, href]);
  const prefetch = useCallback(() => router.prefetch(href), [router, href]);

  const keyNav = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      navigate();
    }
  };

  if (variant === "compact") {
    return (
      <article
        data-vehicle-id={vehicle.id}
        role="link"
        tabIndex={0}
        onClick={navigate}
        onMouseEnter={prefetch}
        onKeyDown={keyNav}
        className={cn(
          "vehicle-card-compact mx-auto w-full max-w-[240px] cursor-pointer overflow-hidden rounded-r border border-nk-border bg-nk-surface transition duration-200",
          "hover:-translate-y-0.5 hover:shadow-nk-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2",
          className,
        )}
      >
        <div className="relative aspect-[3/2] w-full">
          <div className="absolute inset-0" style={{ background: vehicle.grad }} aria-hidden />
          <QualityBadge status={status} className="absolute left-2 top-2" />
        </div>
        <div className="space-y-1 p-3">
          <h4 className="line-clamp-2 font-manrope text-sm font-bold leading-snug text-nk-fg">
            {vehicle.year} {vehicle.make} {vehicle.model}
          </h4>
          <p className="font-manrope text-base font-extrabold tabular-nums text-nk-fg">
            {fmtRD(vehicle.price)}
          </p>
          <p className="text-xs leading-snug text-nk-fg-muted">
            {fmtKm(vehicle.km)} · {vehicle.trans}
          </p>
          <p className="text-xs leading-snug text-nk-fg-muted">{vehicle.loc}</p>
        </div>
      </article>
    );
  }

  if (variant === "list") {
    return (
      <article
        data-vehicle-id={vehicle.id}
        data-price-status={status}
        className={cn(
          "vehicle-card-list grid grid-cols-1 gap-4 rounded-r border border-nk-border bg-nk-surface p-4 transition duration-200",
          "hover:-translate-y-0.5 hover:border-brand hover:shadow-nk-md md:grid-cols-[minmax(0,33%)_minmax(0,40%)_minmax(0,27%)] md:gap-5",
          className,
        )}
      >
        <div
          role="link"
          tabIndex={0}
          onClick={navigate}
          onMouseEnter={prefetch}
          onKeyDown={keyNav}
          className="cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
        >
          <CardPhoto
            vehicle={vehicle}
            status={status}
            photos={photos}
            saved={saved}
            onSaveToggle={onSaveToggle}
            aspectClass="aspect-[4/3] w-full"
          />
        </div>

        <div
          role="link"
          tabIndex={0}
          onClick={navigate}
          onMouseEnter={prefetch}
          onKeyDown={keyNav}
          className="vehicle-card-info min-w-0 cursor-pointer space-y-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
        >
          <h3 className="font-manrope text-lg font-bold text-nk-fg md:text-[18px]">
            {vehicle.year} {vehicle.make} {vehicle.model}
          </h3>
          <p className="text-xs font-medium uppercase tracking-[0.5px] text-nk-fg-muted">
            {vehicle.featuresLine}
          </p>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-[13px] text-nk-fg-muted">
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
          <p className="flex items-center gap-1 text-[13px] text-nk-fg-muted">
            <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden />
            {vehicle.dealerName} · {vehicle.loc}
          </p>
        </div>

        <div className="vehicle-card-actions flex min-w-0 flex-col gap-2 md:items-stretch">
          <div>
            <p className="font-manrope text-[22px] font-extrabold tabular-nums text-nk-fg">
              {fmtRD(vehicle.price)}
            </p>
            <p className="text-sm text-nk-fg-muted">{fmtUS(vehicle.price)}</p>
          </div>
          <div className="flex flex-wrap gap-1.5">
            <QualityBadge status={status} />
            <span className="rounded-full bg-brand-soft px-2 py-0.5 text-[10px] font-bold text-brand">
              {vehicle.match}% match
            </span>
            <PrecioJustoBadge vehicle={vehicle} />
          </div>
          <div className="flex flex-col gap-2 sm:flex-row md:flex-col">
            <Button variant="brand" className="min-h-10 w-full text-[13px]" asChild>
              <Link href={`${href}?financiar=1`} prefetch>
                Aplicar financiamiento
              </Link>
            </Button>
            <Button variant="outline" className="min-h-10 w-full text-[13px]" asChild>
              <Link href={href} prefetch>
                Ver detalles
              </Link>
            </Button>
          </div>
          <p className="text-sm font-semibold tabular-nums text-brand">
            {fmtRD(monthly)}/mes · 60 meses · 13.5% APR
          </p>
        </div>
      </article>
    );
  }

  return (
    <article
      data-testid="vehicle-card"
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
        onMouseEnter={prefetch}
        onKeyDown={keyNav}
        className="relative cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand"
      >
        <CardPhoto
          vehicle={vehicle}
          status={status}
          photos={photos}
          saved={saved}
          onSaveToggle={onSaveToggle}
          aspectClass="aspect-[16/10] w-full"
        />
      </div>

      <div className="flex flex-1 flex-col gap-2.5 p-4">
        <div
          role="link"
          tabIndex={0}
          onClick={navigate}
          onKeyDown={keyNav}
          className="cursor-pointer space-y-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
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
            <span className="rounded-full bg-brand-soft px-2 py-0.5 text-[10px] font-bold text-brand">
              Recién publicado
            </span>
          )}
          {vehicle.year >= 2023 && (
            <span className="rounded-full bg-nk-surface-3 px-2 py-0.5 text-[10px] font-bold text-nk-fg-muted">
              Certificado Nadakki
            </span>
          )}
          <PrecioJustoBadge vehicle={vehicle} />
        </div>

        <div className="flex items-center gap-2 pt-1">
          <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-r-sm bg-nk-surface-2 text-[9px] font-bold text-nk-fg-muted">
            {vehicle.dealerName
              .split(/\s+/)
              .slice(0, 2)
              .map((w) => w[0])
              .join("")
              .toUpperCase()}
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
          <Button variant="brand" className="min-h-11 flex-1 hover:brightness-110" asChild>
            <Link href={`${href}?financiar=1`} onClick={(e) => e.stopPropagation()} prefetch>
              Aplicar financiamiento
            </Link>
          </Button>
          <Button variant="outline" className="min-h-11 px-4" asChild>
            <Link href={href} onClick={(e) => e.stopPropagation()} prefetch>
              Ver
            </Link>
          </Button>
        </div>
      </div>
    </article>
  );
});
