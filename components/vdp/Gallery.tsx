"use client";

import { useState } from "react";
import { Box, Camera, Video } from "lucide-react";
import { QualityBadge } from "@/components/vehicle/QualityBadge";
import { priceStatus } from "@/lib/finance";
import { photoCount, vehiclePhotoUrls, type Vehicle } from "@/lib/vehicles";
import { cn } from "@/lib/utils";

const THUMBNAIL_FILTERS = [undefined, "hue-rotate(18deg)", "hue-rotate(36deg)", "hue-rotate(54deg)", "hue-rotate(72deg)"] as const;

function getVehicleGradient(vehicle: Vehicle): string {
  return vehicle.grad;
}

export function Gallery({ vehicle }: { vehicle: Vehicle }) {
  const [idx, setIdx] = useState(0);
  const urls = vehiclePhotoUrls(vehicle);
  const hayFotos = urls.length > 0;
  const total = hayFotos ? urls.length : photoCount(vehicle);
  const status = priceStatus(vehicle.badge, vehicle.match);
  const thumbCount = hayFotos ? urls.length : Math.min(5, total ?? 0);
  const alt = `${vehicle.year} ${vehicle.make} ${vehicle.model}`;

  return (
    <div className="space-y-3">
      <div
        className="relative overflow-hidden rounded-r"
        style={
          hayFotos
            ? { aspectRatio: "16/10" }
            : {
                background: getVehicleGradient(vehicle),
                aspectRatio: "16/10",
                filter: THUMBNAIL_FILTERS[idx] ?? "hue-rotate(0deg)",
              }
        }
        role="img"
        aria-label={alt}
      >
        {hayFotos ? (
          // <img> y no next/image: media.nadakki.com no esta en images.remotePatterns (next.config.js es de otra zona).
          // eslint-disable-next-line @next/next/no-img-element
          <img
            data-testid="gallery-foto"
            src={urls[Math.min(idx, urls.length - 1)]}
            alt={alt}
            className="absolute inset-0 h-full w-full object-cover"
            loading="eager"
            decoding="async"
          />
        ) : null}
        <QualityBadge status={status} className="absolute left-3 top-3" />
        <div className="absolute right-3 top-3 flex gap-2">
          <button
            type="button"
            className="inline-flex items-center gap-1.5 rounded-full bg-white/90 px-3 py-1.5 text-xs font-semibold text-nk-fg shadow-nk-sm backdrop-blur-sm transition hover:bg-white"
          >
            <Box className="h-3.5 w-3.5" aria-hidden />
            Ver 360°
          </button>
          <button
            type="button"
            className="inline-flex items-center gap-1.5 rounded-full bg-white/90 px-3 py-1.5 text-xs font-semibold text-nk-fg shadow-nk-sm backdrop-blur-sm transition hover:bg-white"
          >
            <Video className="h-3.5 w-3.5" aria-hidden />
            Video AI
          </button>
        </div>
        {total ? (
          <span className="absolute bottom-3 left-3 inline-flex items-center gap-1 rounded-full bg-black/55 px-2.5 py-1 text-xs font-semibold text-white backdrop-blur-sm">
            <Camera className="h-3 w-3" aria-hidden />
            {idx + 1}/{total}
          </span>
        ) : null}
      </div>

      <div className="grid grid-cols-5 gap-2" data-testid="gallery-miniaturas">
        {Array.from({ length: thumbCount }, (_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setIdx(i)}
            className={cn(
              "relative aspect-[4/3] overflow-hidden rounded-r-sm bg-nk-surface-2 transition",
              idx === i ? "ring-2 ring-brand ring-offset-2" : "opacity-80 hover:opacity-100",
            )}
            aria-label={`Foto ${i + 1}`}
            aria-current={idx === i}
          >
            {hayFotos ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={urls[i]}
                alt=""
                className="absolute inset-0 h-full w-full object-cover"
                loading="lazy"
                decoding="async"
              />
            ) : (
              <div
                className="absolute inset-0"
                style={{
                  background: getVehicleGradient(vehicle),
                  filter: THUMBNAIL_FILTERS[i] ?? undefined,
                }}
              />
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
