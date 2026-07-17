"use client";

import Image from "next/image";
import { useState } from "react";
import { Box, Video } from "lucide-react";
import { QualityBadge } from "@/components/vehicle/QualityBadge";
import { priceStatus } from "@/lib/finance";
import {
  getVehicleFallbackUrl,
  getVehicleImaginUrl,
} from "@/lib/vehicle-images";
import { photoCount, type Vehicle } from "@/lib/vehicles";
import { cn } from "@/lib/utils";

type ImageStage = "imagin" | "fallback" | "gradient";

function GalleryImage({
  vehicle,
  className,
}: {
  vehicle: Vehicle;
  className?: string;
}) {
  const [stage, setStage] = useState<ImageStage>("imagin");

  if (stage === "gradient") {
    return (
      <div
        className={cn("h-full w-full", className)}
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
        className={cn("h-full w-full", className)}
        style={{ background: vehicle.grad }}
        aria-hidden
      />
    );
  }

  return (
    <Image
      src={src}
      alt={`${vehicle.year} ${vehicle.make} ${vehicle.model}`}
      fill
      className={cn("object-cover", className)}
      sizes="(max-width: 768px) 100vw, 60vw"
      onError={() => {
        if (stage === "imagin" && getVehicleFallbackUrl(vehicle)) {
          setStage("fallback");
        } else {
          setStage("gradient");
        }
      }}
    />
  );
}

export function Gallery({ vehicle }: { vehicle: Vehicle }) {
  const [idx, setIdx] = useState(0);
  const total = photoCount(vehicle.id);
  const status = priceStatus(vehicle.badge, vehicle.match);
  const thumbCount = Math.min(5, total);

  return (
    <div className="space-y-3">
      <div className="relative aspect-[16/10] overflow-hidden rounded-r bg-nk-surface-2">
        <GalleryImage vehicle={vehicle} />
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
        <span className="absolute bottom-3 left-3 rounded-full bg-black/55 px-2.5 py-1 text-xs font-semibold text-white backdrop-blur-sm">
          {idx + 1}/{total}
        </span>
      </div>

      <div className="grid grid-cols-5 gap-2">
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
            <div
              className="absolute inset-0"
              style={{
                background: vehicle.grad,
                filter: i > 0 ? `hue-rotate(${i * 18}deg)` : undefined,
              }}
            />
          </button>
        ))}
      </div>
    </div>
  );
}
