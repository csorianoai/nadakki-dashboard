"use client";

import { useReducedMotion } from "framer-motion";
import React, { useId } from "react";
import type { ApplicationHealthData } from "@/lib/credit/app-health-score";
import {
  calculateApplicationHealthScore,
  getHealthScoreFactors,
  getHealthScoreSuggestions,
  getHealthScoreZone,
  type HealthScoreFactorRow,
  type HealthScoreZone,
  type HealthSuggestion,
} from "@/lib/credit/app-health-score";

export interface AppHealthScoreProps {
  applicationId: string;
  tenantId: string;
  applicationData: ApplicationHealthData;
  /** When provided, muestra sliders numéricos que actualizan el gauge en vivo. */
  onApplicationDataPatch?: (patch: Partial<ApplicationHealthData>) => void;
}

const ZONE_PALETTE: Record<
  HealthScoreZone,
  { labelEs: string; bar: string; ring: string; hint: string }
> = {
  excellent: {
    labelEs: "Excelente probabilidad",
    bar: "from-emerald-400 to-teal-500",
    ring: "stroke-emerald-400",
    hint: "Zona favorable (≥80)",
  },
  good: {
    labelEs: "Buena probabilidad · posibles estipulaciones",
    bar: "from-amber-300 to-amber-500",
    ring: "stroke-amber-400",
    hint: "Zona estable (60–79)",
  },
  fair: {
    labelEs: "Contrapropuesta probable",
    bar: "from-orange-400 to-orange-600",
    ring: "stroke-orange-500",
    hint: "Zona delicada (40–59)",
  },
  poor: {
    labelEs: "Declinación probable",
    bar: "from-rose-500 to-red-700",
    ring: "stroke-rose-600",
    hint: "Alta tensión (<40)",
  },
};

/** Re-export tipo para consumidores del componente. */
export type { ApplicationHealthData } from "@/lib/credit/app-health-score";

export function AppHealthScore({
  applicationId,
  tenantId,
  applicationData,
  onApplicationDataPatch,
}: AppHealthScoreProps): React.ReactElement {
  void applicationId;
  void tenantId;

  const meterId = useId();
  const reduceMotion = useReducedMotion();

  const score = calculateApplicationHealthScore(applicationData);
  const zone = getHealthScoreZone(score);
  const factors = getHealthScoreFactors(applicationData);
  const suggestions = getHealthScoreSuggestions(applicationData);
  const pal = ZONE_PALETTE[zone];

  const animated = !reduceMotion;

  return (
    <section
      className="rounded-2xl border border-white/10 bg-gradient-to-br from-slate-900/90 to-violet-950/30 p-4 sm:p-6"
      data-testid="app-health-score-root"
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-violet-300">
            Salud de expediente · T6.4
          </p>
          <h2 id={`${meterId}-title`} className="mt-1 font-display text-lg font-semibold text-white">
            Indicador de salud ({score}/100)
          </h2>
          <p className="mt-2 text-xs text-slate-400">{pal.hint}</p>
          <Gauge
            score={score}
            zoneLabel={pal.labelEs}
            barClass={pal.bar}
            labelledBy={`${meterId}-title`}
            animated={animated}
          />
          <ZoneLabel zone={zone} labelEs={pal.labelEs} />
        </div>
        <FactorBreakdown factors={factors} />
      </div>

      <Suggestions items={suggestions} />

      {onApplicationDataPatch ? (
        <CalibrationPanel data={applicationData} onPatch={onApplicationDataPatch} />
      ) : null}
    </section>
  );
}

function Gauge({
  score,
  zoneLabel,
  barClass,
  labelledBy,
  animated,
}: {
  score: number;
  zoneLabel: string;
  barClass: string;
  labelledBy: string;
  animated: boolean;
}): React.ReactElement {
  return (
    <div className="mt-4 space-y-2">
      <div
        aria-labelledby={labelledBy}
        aria-label={`Probabilidad de aprobación: ${score} de cien`}
        aria-valuemax={100}
        aria-valuemin={0}
        aria-valuenow={score}
        aria-valuetext={`${score} de 100, ${zoneLabel}`}
        className={`relative h-3 w-full overflow-hidden rounded-full bg-slate-800 ${animated ? "transition-colors" : ""}`}
        role="meter"
      >
        <div
          className={`h-full rounded-full bg-gradient-to-r ${barClass} ${
            animated ? "motion-safe:transition-[width] motion-safe:duration-500 motion-safe:ease-out" : ""
          }`}
          data-testid="app-health-gauge-fill"
          style={{ width: `${Math.min(100, Math.max(0, score))}%` }}
        />
      </div>
    </div>
  );
}

function ZoneLabel({
  zone,
  labelEs,
}: {
  zone: HealthScoreZone;
  labelEs: string;
}): React.ReactElement {
  const dataAttr = zone;
  return (
    <div className="mt-2">
      <span
        data-testid="app-health-zone"
        data-zone={dataAttr}
        className={`inline-flex items-center rounded-lg border px-2 py-1 text-[11px] font-medium ${
          zone === "excellent"
            ? "border-emerald-500/40 text-emerald-200"
            : zone === "good"
              ? "border-amber-500/35 text-amber-100"
              : zone === "fair"
                ? "border-orange-500/35 text-orange-100"
                : "border-rose-500/40 text-rose-100"
        }`}
      >
        {labelEs}
      </span>
    </div>
  );
}

function FactorBreakdown({ factors }: { factors: HealthScoreFactorRow[] }): React.ReactElement {
  return (
    <div
      aria-label="Desglose de factores"
      className="mt-2 w-full min-w-[260px] max-w-md rounded-xl border border-white/10 bg-slate-950/40 p-3 text-xs text-slate-200 lg:mt-0"
    >
      <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
        Contribución por factor (max teórico)
      </p>
      <ul className="space-y-2">
        {factors.map((f) => (
          <li key={f.id} className="flex justify-between gap-2 border-b border-white/5 pb-1 last:border-0">
            <span className={f.unknown ? "text-slate-500" : undefined}>
              {f.label}
              {f.unknown ? " · Sin dato" : null}
            </span>
            <span className="font-mono text-slate-300">
              +{f.contributed.toFixed(1)}
              {" / "}
              {f.weightPct}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function priorityStyle(priority: HealthSuggestion["priority"]): string {
  if (priority === "high") return "border-rose-500/40 bg-rose-950/40 text-rose-100";
  if (priority === "medium") return "border-amber-500/40 bg-amber-950/35 text-amber-50";
  return "border-white/15 bg-white/5 text-slate-200";
}

function Suggestions({ items }: { items: HealthSuggestion[] }): React.ReactElement {
  if (items.length === 0) return <></>;

  return (
    <div className="mt-5">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
        Acciones recomendadas
      </p>
      <ul className="mt-2 flex flex-wrap gap-2" data-testid="app-health-suggestions">
        {items.map((item, idx) => (
          <li
            key={`${item.action}-${item.impact}-${item.priority}-${idx}`}
            data-priority={item.priority}
            className={`rounded-lg border px-3 py-1.5 text-xs ${priorityStyle(item.priority)}`}
          >
            <span className="font-medium">{item.action}</span>
            <span className="ml-2 text-[11px] text-slate-300">({item.impact})</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function CalibrationPanel({
  data,
  onPatch,
}: {
  data: ApplicationHealthData;
  onPatch: (p: Partial<ApplicationHealthData>) => void;
}): React.ReactElement {
  function field(
    key: keyof ApplicationHealthData,
    label: string,
    opts: Partial<React.InputHTMLAttributes<HTMLInputElement>> = {}
  ): React.ReactElement {
    const raw = data[key];
    const value = raw == null ? "" : String(raw);
    return (
      <label className="block text-[11px] text-slate-400">
        {label}
        <input
          type="number"
          className="mt-1 min-h-[40px] w-full rounded-lg border border-white/15 bg-slate-950/60 px-2 py-1 text-sm text-white"
          inputMode="decimal"
          value={value}
          onChange={(e) => {
            const next = e.target.value;
            if (next === "") {
              const empty = { [key]: undefined } as Partial<ApplicationHealthData>;
              onPatch(empty);
              return;
            }
            const num = Number(next);
            if (Number.isNaN(num)) return;
            onPatch({ [key]: num } as Partial<ApplicationHealthData>);
          }}
          {...opts}
        />
      </label>
    );
  }

  return (
    <div className="mt-6 rounded-xl border border-violet-500/20 bg-slate-950/50 p-3 sm:p-4">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-violet-200">
        Ajustes rápidos (simulador en tiempo real)
      </p>
      <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {field("credit_score", "Credit score proxy (0–850)", { min: 300, max: 850 })}
        {field("dti_ratio", "DTI % (≤50 mejor)", { min: 0, max: 50 })}
        {field("ltv_ratio", "LTV % (≤100 mejor)", { min: 0, max: 100 })}
        {field("employment_years", "Años empleo (máx. 5 modelo)", {
          min: 0,
          max: 20,
          step: 0.1,
        })}
        {field("documents_provided", "Docs provistos", { min: 0, max: 99 })}
        {field("documents_required", "Docs requeridos", { min: 1, max: 99 })}
      </div>
    </div>
  );
}
