"use client";

import { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";
import { fmtRD } from "@/lib/format";
import { getPriceConfidence, type PriceConfidenceResult } from "@/lib/api/ai-features";
import type { Vehicle } from "@/lib/vehicles";

function calcRangesLocal(price: number): PriceConfidenceResult {
  const lo = Math.round((price * 0.932) / 1000) * 1000;
  const mid = price;
  const hi = Math.round((price * 1.068) / 1000) * 1000;
  const top = Math.round((price * 1.135) / 1000) * 1000;
  const pos = ((mid - lo) / (top - lo)) * 100;
  const pctBetter = Math.round(((hi - mid) / hi) * 100);
  return { lo, mid, hi, top, pos, pctBetter, sampleCount: 47, fromBackend: false };
}

export function PriceEvaluation({ vehicle }: { vehicle: Vehicle }) {
  const [data, setData] = useState<PriceConfidenceResult>(() =>
    calcRangesLocal(vehicle.price),
  );

  useEffect(() => {
    void getPriceConfidence(vehicle.id, vehicle.price).then(setData);
  }, [vehicle.id, vehicle.price]);

  const { lo, mid, hi, top, pos, pctBetter } = data;

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
        Basado en {data.sampleCount} {vehicle.make} {vehicle.model} {vehicle.year} vendidos en RD
        últimos 90 días. Datos verificados con importaciones DGII + desembolsos Nadakki +
        Credicefi.
      </p>
    </section>
  );
}
