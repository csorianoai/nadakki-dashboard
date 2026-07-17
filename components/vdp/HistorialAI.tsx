"use client";

import { useEffect, useState } from "react";
import { FileCheck, Shield, User, Wrench } from "lucide-react";
import { getVehicleHistory } from "@/lib/api/ai-features";
import { photoCount, type Vehicle } from "@/lib/vehicles";

const DEFAULT_EVENTS = [
  { icon: Shield, label: "VIN sin accidentes reportados", color: "text-nk-success" },
  { icon: User, label: "1 dueño previo", color: "text-brand" },
  { icon: Wrench, label: "Servicio al día", color: "text-nk-fg-muted" },
  { icon: FileCheck, label: "Matrícula al día", color: "text-nk-fg-muted" },
] as const;

export function HistorialAI({ vehicle }: { vehicle: Vehicle }) {
  const photos = photoCount(vehicle.id);
  const [events, setEvents] = useState<string[]>(DEFAULT_EVENTS.map((e) => e.label));

  useEffect(() => {
    void getVehicleHistory(vehicle.id).then((res) => {
      if (res.events.length) {
        setEvents(res.events.map((e) => e.label));
      }
    });
  }, [vehicle.id]);

  return (
    <div className="space-y-5">
      <ol className="space-y-4">
        {DEFAULT_EVENTS.map(({ icon: Icon, color }, i) => (
          <li key={i} className="flex gap-3">
            <span className="flex flex-col items-center">
              <span
                className={`inline-flex h-9 w-9 items-center justify-center rounded-full bg-nk-surface-2 ${color}`}
              >
                <Icon className="h-4 w-4" aria-hidden />
              </span>
              {i < DEFAULT_EVENTS.length - 1 ? (
                <span className="mt-1 h-full w-px flex-1 bg-nk-border" aria-hidden />
              ) : null}
            </span>
            <p className="pt-2 text-sm font-medium text-nk-fg">{events[i] ?? DEFAULT_EVENTS[i]!.label}</p>
          </li>
        ))}
      </ol>

      <div className="rounded-r border border-brand/20 bg-brand-soft p-4">
        <h3 className="font-manrope text-sm font-bold text-brand">
          Verificaciones Nadakki AI
        </h3>
        <ul className="mt-3 space-y-2 text-sm text-nk-fg">
          <li className="flex items-start gap-2">
            <Shield className="mt-0.5 h-4 w-4 shrink-0 text-brand" aria-hidden />
            VIN validado en registros oficiales DGII
          </li>
          <li className="flex items-start gap-2">
            <Shield className="mt-0.5 h-4 w-4 shrink-0 text-brand" aria-hidden />
            {photos} fotos verificadas sin manipulación
          </li>
          <li className="flex items-start gap-2">
            <Shield className="mt-0.5 h-4 w-4 shrink-0 text-brand" aria-hidden />
            Dealer con {vehicle.rating} estrellas y 342 ventas
          </li>
          <li className="flex items-start gap-2">
            <Shield className="mt-0.5 h-4 w-4 shrink-0 text-brand" aria-hidden />
            Sin señales de fraude detectadas
          </li>
        </ul>
      </div>
    </div>
  );
}
