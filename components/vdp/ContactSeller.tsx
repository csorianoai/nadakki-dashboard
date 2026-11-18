"use client";

import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Vehicle } from "@/lib/vehicles";

/** Solo con vendedor real. Valoraciones y telefono no existen en el modelo: no se muestran. */
export function ContactSeller({ vehicle }: { vehicle: Vehicle }) {
  if (!vehicle.dealerName) return null;
  const defaultMsg = `¡Hola! Este ${vehicle.make} ${vehicle.model} ${vehicle.year} se ve interesante. ¿Sigue disponible?`;

  return (
    <section className="rounded-r border border-nk-border bg-nk-surface p-5 shadow-nk-sm">
      <h2 className="font-manrope text-lg font-bold text-nk-fg">
        Contactar {vehicle.dealerName}
      </h2>
      {vehicle.rating != null && vehicle.avgResp ? (
        <p className="mt-1 flex items-center gap-1 text-sm text-nk-fg-muted">
          <Star className="h-4 w-4 fill-nk-warning text-nk-warning" aria-hidden />
          {vehicle.rating.toFixed(1)} · responde en ~{vehicle.avgResp}
        </p>
      ) : null}

      <textarea
        defaultValue={defaultMsg}
        rows={4}
        className="mt-4 w-full resize-none rounded-r-sm border border-nk-border bg-nk-surface-2 px-3 py-2.5 text-sm text-nk-fg focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
      />

      <div className="mt-3 flex flex-wrap gap-2">
        <Button variant="brand" className="flex-1">
          Enviar mensaje
        </Button>
      </div>
    </section>
  );
}
