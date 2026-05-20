"use client";

import { useMemo } from "react";
import {
  CartesianGrid,
  Rectangle,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis,
} from "recharts";
import type { BankAnalytics } from "@/types/bank-analytics";

export function RiskHeatmapSkeleton() {
  return (
    <div
      className="h-[380px] w-full animate-pulse rounded-xl border border-white/10 bg-white/[0.04]"
      aria-hidden
      data-testid="risk-heatmap-skeleton"
    />
  );
}

/** Canonical Phase C bucket labels shown on axes (normalized from API aliases). */
const AMOUNT_TICKS = ["0–50k", "50k–100k", "100k–250k", "250k–500k", "500k+"];
const RISK_TICKS = ["0–30", "30–50", "50–70", "70–85", "85–100"];

function normBucket(s: string): string {
  return s.trim().replace(/\u2013/g, "-").replace(/\s+/g, "").replace(/,/g, "").toLowerCase();
}

function inferAmountAxisIndex(bucketRaw: string): number {
  const b = normBucket(bucketRaw);
  if (/500\+|500k\+|>500|^500\+$/i.test(bucketRaw.trim()) || /\b500k\+\b/i.test(bucketRaw.trim())) return 4;
  if (b.includes("250") && b.includes("500")) return 3;
  if (
    ((b.includes("100") || b.includes("0100")) && (b.includes("250") || b.includes("0250"))) ||
    b.includes("100-250") ||
    b.includes("100k250")
  ) {
    return 2;
  }
  if ((b.includes("50") || b.includes("050")) && (b.includes("100") || b.includes("0100"))) return 1;
  if (/0\s*[-–]\s*50|^50k$/i.test(b) || /upto|under.?50|^primer.?tramo/i.test(bucketRaw.trim().toLowerCase())) {
    return 0;
  }
  const needle = AMOUNT_TICKS.map((t) => normBucket(t)).indexOf(b.replace(/usd|rd|dop/g, ""));
  return needle >= 0 ? needle : 0;
}

function inferRiskAxisIndex(bucketRaw: string): number {
  const b = normBucket(bucketRaw);
  const raw = bucketRaw.trim();
  if (/\b(critical|alto|high)\b/i.test(raw) || /85.?100|^85|^90\b/i.test(b) || raw.includes("85-100")) return 4;
  if (/70.?85/i.test(b)) return 3;
  if (/50.?70/i.test(b)) return 2;
  if (/30.?50/i.test(b)) return 1;
  if (/0.?30/i.test(b) || /\blow\b|\bprimer\b/i.test(raw)) return 0;
  const needle = RISK_TICKS.map((t) => normBucket(t)).indexOf(b);
  return needle >= 0 ? needle : 0;
}

type ScatterDatum = {
  xAmt: number;
  yRisk: number;
  volume: number;
  fill: string;
  amountBucket: string;
  riskBucket: string;
};

function HeatCellShape(props: { cx?: number; cy?: number; payload?: ScatterDatum }) {
  const { cx = 0, cy = 0, payload } = props;
  const w = 44;
  const h = 36;
  const fill = payload?.fill ?? "rgba(99,102,241,0.35)";
  return (
    <Rectangle
      role="presentation"
      x={cx - w / 2}
      y={cy - h / 2}
      width={w}
      height={h}
      fill={fill}
      stroke="rgba(255,255,255,0.08)"
      radius={[10, 10, 10, 10]}
    />
  );
}

interface RiskHeatmapProps {
  cells: BankAnalytics["riskHeatmap"]["cells"];
  loading: boolean;
}

export function RiskHeatmap({ cells, loading }: RiskHeatmapProps) {
  const scatterData = useMemo(() => {
    const maxVol = Math.max(1, ...cells.map((c) => c.volume));
    return cells.map((cell): ScatterDatum => {
      const xi = inferAmountAxisIndex(cell.amountBucket);
      const yi = inferRiskAxisIndex(cell.riskBucket);
      const xAmt = Math.min(AMOUNT_TICKS.length - 1, Math.max(0, xi)) + 1;
      const yRisk = Math.min(RISK_TICKS.length - 1, Math.max(0, yi)) + 1;
      const trimmed = cell.color?.trim?.() ?? "";
      const hex =
        trimmed.length &&
        trimmed !== "auto" &&
        /^#?[0-9a-f]{3,8}$/i.test(trimmed) &&
        (trimmed.startsWith("#") ? trimmed : `#${trimmed}`);
      const opacity = Math.min(1, Math.max(0.15, Math.sqrt(cell.volume / maxVol)));
      return {
        xAmt,
        yRisk,
        volume: cell.volume,
        fill: hex && hex.length <= 10 ? hex : `rgba(129,140,248,${opacity.toFixed(3)})`,
        amountBucket: cell.amountBucket.trim(),
        riskBucket: cell.riskBucket.trim(),
      };
    });
  }, [cells]);

  if (loading) {
    return <RiskHeatmapSkeleton />;
  }

  if (!cells.length) {
    return (
      <p className="text-sm text-gray-500" data-testid="risk-heatmap-empty">
        Sin agrupaciones de riesgo en este periodo.
      </p>
    );
  }

  return (
    <div
      className="w-full min-w-0 rounded-xl border border-white/10 bg-slate-950/40 p-3 sm:p-4"
      data-testid="risk-heatmap"
      role="img"
      aria-label="Mapa de calor por tramo de monto y puntaje — solo volumen agregado, sin aplicaciones individuales"
    >
      <ResponsiveContainer width="100%" height={360}>
        <ScatterChart margin={{ top: 12, right: 24, bottom: 32, left: 8 }}>
          <CartesianGrid strokeDasharray="4 8" stroke="rgba(148,163,184,0.12)" vertical={false} />
          <XAxis
            type="number"
            dataKey="xAmt"
            name="Montos"
            domain={[0.5, AMOUNT_TICKS.length + 0.5]}
            ticks={[1, 2, 3, 4, 5]}
            tickFormatter={(v: number) => AMOUNT_TICKS[Math.round(v) - 1] ?? ""}
            stroke="#cbd5f5"
            tick={{ fill: "#9ca3af", fontSize: 11 }}
            label={{ value: "Tramos de monto del préstamo", position: "bottom", fill: "#a78bfa", fontSize: 11 }}
          />
          <YAxis
            type="number"
            dataKey="yRisk"
            name="Riesgo"
            domain={[0.5, RISK_TICKS.length + 0.5]}
            ticks={[1, 2, 3, 4, 5]}
            tickFormatter={(v: number) => RISK_TICKS[Math.round(v) - 1] ?? ""}
            stroke="#cbd5f5"
            tick={{ fill: "#9ca3af", fontSize: 11 }}
            label={{
              value: "Tramos de puntaje de riesgo",
              angle: -90,
              position: "insideLeft",
              fill: "#a78bfa",
              fontSize: 11,
            }}
          />
          <ZAxis type="number" dataKey="volume" range={[22, 64]} />
          <Tooltip
            cursor={{ strokeDasharray: "3 6" }}
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const p = payload[0]?.payload as ScatterDatum | undefined;
              if (!p) return null;
              return (
                <div className="max-w-[18rem] rounded-lg border border-white/15 bg-slate-950/95 px-3 py-2 text-xs shadow-xl backdrop-blur">
                  <p className="font-semibold text-white">Cubeta agregada</p>
                  <p className="mt-1 text-gray-400">
                    {p.amountBucket} × {p.riskBucket}
                  </p>
                  <p className="mt-1 text-emerald-200">
                    Casos sintetizados (conteos): <strong>{p.volume}</strong>
                  </p>
                  <p className="mt-2 text-[10px] leading-snug text-gray-500">
                    Sin cédulas, nombres, correos ni identificadores de expediente individuales.
                  </p>
                </div>
              );
            }}
          />
          <Scatter
            name="Cubetas"
            data={scatterData}
            fill="#818cf8"
            isAnimationActive={false}
            shape={(shapeProps: { cx?: number; cy?: number; payload?: ScatterDatum }) => (
              <HeatCellShape cx={shapeProps.cx} cy={shapeProps.cy} payload={shapeProps.payload} />
            )}
          />
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
}
