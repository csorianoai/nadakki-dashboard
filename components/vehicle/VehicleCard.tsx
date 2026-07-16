"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Camera, Check, MapPin, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { fmtKm, fmtRD, fmtUS } from "@/lib/format";
import { cuota, priceStatus } from "@/lib/finance";
import { photoCount, type Vehicle } from "@/lib/vehicles";
import { QualityBadge } from "@/components/vehicle/QualityBadge";
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

export function VehicleCard({
  vehicle,
  saved = false,
  onSaveToggle,
  className,
}: {
  vehicle: Vehicle;
  saved?: boolean;
  onSaveToggle?: () => void;
  className?: string;
}) {
  const router = useRouter();
  const status = priceStatus(vehicle.badge, vehicle.match);
  const monthly = Math.round(cuota(vehicle.price, 20, 60));
  const href = `/autos/vehiculo/${vehicle.id}`;
  const photos = photoCount(vehicle.id);

  const navigate = () => router.push(href);

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
        <div className="aspect-[4/3]" style={{ background: vehicle.grad }} aria-hidden />
        <QualityBadge status={status} className="absolute left-3 top-3" />
        <div className="absolute right-3 top-3">
          <SaveButton
            saved={saved}
            onToggle={onSaveToggle ?? (() => undefined)}
          />
        </div>
        <span className="absolute bottom-3 right-3 inline-flex items-center gap-1 rounded-full bg-black/55 px-2 py-1 text-[10px] font-semibold text-white backdrop-blur-sm">
          <Camera className="h-3 w-3" aria-hidden />
          {photos} fotos
        </span>
      </div>

      <div className="flex flex-1 flex-col gap-2 p-4">
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
          className="cursor-pointer space-y-1"
        >
          <h3 className="font-manrope text-[15.5px] font-bold leading-snug text-nk-fg">
            {vehicle.year} {vehicle.make} {vehicle.model}
          </h3>
          <p className="flex items-center gap-1 text-xs text-nk-fg-muted">
            <MapPin className="h-3 w-3 shrink-0" aria-hidden />
            {vehicle.loc} · {fmtKm(vehicle.km)} · {vehicle.trans} · {vehicle.fuel}
          </p>
          <p className="font-manrope text-lg font-extrabold tabular-nums text-nk-fg">
            {fmtRD(vehicle.price)}{" "}
            <span className="text-[11px] font-medium text-nk-fg-subtle">{fmtUS(vehicle.price)}</span>
          </p>
          <p className="text-[15px] font-semibold tabular-nums text-brand">
            {fmtRD(monthly)}/mes · 60 meses · 13.5% APR
          </p>
          <p className="text-[12px] font-medium uppercase tracking-[0.5px] text-nk-fg-subtle">
            {vehicle.featuresLine}
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
          {vehicle.verified && (
            <span className="inline-flex items-center gap-0.5 rounded-full bg-nk-success/15 px-2 py-0.5 text-[10px] font-bold text-nk-success">
              <Check className="h-3 w-3" aria-hidden />
              Dealer Verified
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 pt-1">
          <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-r-sm bg-nk-surface-2 text-[10px] font-bold text-nk-fg-muted">
            {dealerInitials(vehicle.dealerName)}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-semibold text-nk-fg">{vehicle.dealerName}</p>
            <p className="flex items-center gap-1 text-[11px] text-nk-fg-subtle">
              <Star className="h-3 w-3 fill-nk-warning text-nk-warning" aria-hidden />
              {vehicle.rating.toFixed(1)} ({vehicle.reviews})
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
