"use client";

import Link from "next/link";
import type { ConciergeVehicle } from "@/lib/api/concierge";

function precio(v: ConciergeVehicle): string {
  if (v.price_amount === null) return "Precio a consultar";
  return `${v.price_currency ?? ""} ${Math.round(v.price_amount).toLocaleString("es-AR")}`.trim();
}

/** Autos REALES que devolvio el backend: solo se pintan los que trae la respuesta; nada de inventario de ejemplo. */
export function InlineVehicleRec({ vehicles, onNavigate }: { vehicles: ConciergeVehicle[]; onNavigate?: () => void }) {
  if (!vehicles.length) return null;
  return (
    <ul className="mt-3 space-y-2" aria-label="Autos recomendados">
      {vehicles.map((v) => (
        <li key={v.id}>
          <Link href={v.url} onClick={onNavigate}
            className="flex min-h-11 items-center gap-3 rounded border border-nk-border p-2 text-sm">
            {v.primary_photo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={v.primary_photo_url} alt="" className="h-12 w-16 flex-none rounded object-cover" />
            ) : null}
            <span className="min-w-0">
              <span className="block font-semibold">{[v.make, v.model, v.year].filter(Boolean).join(" ")}</span>
              <span className="block">{precio(v)}{v.mileage_km !== null ? ` · ${v.mileage_km.toLocaleString("es-AR")} km` : ""}</span>
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
