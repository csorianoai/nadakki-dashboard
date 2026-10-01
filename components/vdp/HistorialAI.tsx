"use client";

import { useEffect, useState } from "react";
import { FileCheck, Shield } from "lucide-react";
import { getVehicleHistory, type VehicleHistoryResult } from "@/lib/api/ai-features";
import type { Vehicle } from "@/lib/vehicles";

export function HistorialAI({ vehicle }: { vehicle: Vehicle }) {
  const [history, setHistory] = useState<VehicleHistoryResult | null>(null);

  useEffect(() => {
    let active = true;
    setHistory(null);
    void getVehicleHistory(vehicle.id).then((next) => {
      if (active) setHistory(next);
    });
    return () => {
      active = false;
    };
  }, [vehicle.id]);

  if (history === null) {
    return <p className="text-sm text-nk-fg-muted">Consultando historial verificado…</p>;
  }

  if (!history.fromBackend) {
    return (
      <div className="rounded-r border border-nk-border bg-nk-surface p-4" role="status">
        <p className="text-sm font-medium text-nk-fg">Historial verificado no disponible.</p>
        <p className="mt-1 text-xs text-nk-fg-muted">
          No se muestran accidentes, propietarios, servicios ni verificaciones cuando la fuente no responde.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {history.events.length ? (
        <ol className="space-y-4">
          {history.events.map((event, i) => (
            <li key={`${event.label}-${i}`} className="flex gap-3">
              <span className="flex flex-col items-center">
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-nk-surface-2 text-brand">
                  <FileCheck className="h-4 w-4" aria-hidden />
                </span>
                {i < history.events.length - 1 ? (
                  <span className="mt-1 h-full w-px flex-1 bg-nk-border" aria-hidden />
                ) : null}
              </span>
              <p className="pt-2 text-sm font-medium text-nk-fg">{event.label}</p>
            </li>
          ))}
        </ol>
      ) : (
        <p className="text-sm text-nk-fg-muted">La fuente respondió sin eventos de historial.</p>
      )}

      <div className="rounded-r border border-brand/20 bg-brand-soft p-4">
        <h3 className="font-manrope text-sm font-bold text-brand">Verificaciones Nadakki AI</h3>
        {history.verifications.length ? (
          <ul className="mt-3 space-y-2 text-sm text-nk-fg">
            {history.verifications.map((verification) => (
              <li key={verification} className="flex items-start gap-2">
                <Shield className="mt-0.5 h-4 w-4 shrink-0 text-brand" aria-hidden />
                {verification}
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 text-sm text-nk-fg-muted">La fuente no devolvió verificaciones.</p>
        )}
      </div>
    </div>
  );
}
