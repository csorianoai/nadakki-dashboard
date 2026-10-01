"use client";

import { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";
import { fmtRD } from "@/lib/format";
import { getPriceConfidence, type PriceConfidenceResult } from "@/lib/api/ai-features";
import type { Vehicle } from "@/lib/vehicles";

export function PriceEvaluation({ vehicle }: { vehicle: Vehicle }) {
  const [data, setData] = useState<PriceConfidenceResult | null>(null);

  useEffect(() => {
    let active = true;
    setData(null);
    void getPriceConfidence(vehicle.id).then((next) => {
      if (active) setData(next);
    });
    return () => {
      active = false;
    };
  }, [vehicle.id]);

  if (data === null) {
    return (
      <section className="rounded-r border border-nk-border bg-nk-surface p-5 shadow-nk-sm">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-brand" aria-hidden />
          <h2 className="font-manrope text-lg font-bold text-nk-fg">Análisis de precio Nadakki AI</h2>
        </div>
        <p className="mt-3 text-sm text-nk-fg-muted">Consultando evidencia de mercado…</p>
      </section>
    );
  }

  const { lo, mid, hi, top, pos, pctBetter, sampleCount, fromBackend } = data;
  const complete =
    fromBackend &&
    lo != null &&
    mid != null &&
    hi != null &&
    top != null &&
    pos != null &&
    pctBetter != null &&
    sampleCount != null;

  if (!complete) {
    return (
      <section className="rounded-r border border-nk-border bg-nk-surface p-5 shadow-nk-sm">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-brand" aria-hidden />
          <h2 className="font-manrope text-lg font-bold text-nk-fg">Análisis de precio Nadakki AI</h2>
        </div>
        <p className="mt-3 text-sm text-nk-fg-muted" role="status">
          Evidencia de mercado no disponible. No se estimó precio, muestra ni comparación local.
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-r border border-nk-border bg-nk-surface p-5 shadow-nk-sm">
      <div className="mb-4 flex items-center gap-2">
        <Sparkles className="h-5 w-5 text-brand" aria-hidden />
        <h2 className="font-manrope text-lg font-bold text-nk-fg">
          Análisis de precio Nadakki AI
        </h2>
      </div>

      <div className="relative mb-2 h-[60px] overflow-hidden rounded-r-sm">
        <div className="absolute inset-0 flex">
          <div className="h-full w-[40%] bg-nk-success/30" title="Excelente" />
          <div className="h-full w-[30%] bg-nk-success/50" title="Precio justo" />
          <div className="h-full w-[30%] bg-nk-warning/40" title="Sobre mercado" />
        </div>
        <div
          className="absolute top-0 z-10 flex h-full flex-col items-center"
          style={{ left: `${Math.min(96, Math.max(4, pos))}%`, transform: "translateX(-50%)" }}
        >
          <div className="h-full w-0.5 bg-brand" />
          <span className="mt-1 whitespace-nowrap rounded bg-brand px-2 py-0.5 text-[10px] font-bold text-white">
            {fmtRD(mid)}
          </span>
        </div>
      </div>

      <div className="mb-4 flex justify-between text-[10px] font-semibold uppercase tracking-wide text-nk-fg-muted">
        <span>{fmtRD(lo)}</span>
        <span>{fmtRD(hi)}</span>
        <span>{fmtRD(top)}</span>
      </div>

      <p className="text-sm leading-relaxed text-nk-fg">
        Este precio es <strong>{pctBetter}% mejor</strong> que el promedio del mercado.
      </p>
      <p className="mt-2 text-xs leading-relaxed text-nk-fg-muted">
        Basado en {sampleCount} {vehicle.make} {vehicle.model} {vehicle.year} de la muestra devuelta por el backend.
      </p>
    </section>
  );
}
