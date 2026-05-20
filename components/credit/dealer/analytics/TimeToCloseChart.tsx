"use client";

import { ArrowDownRight, ArrowRight, ArrowUpRight } from "lucide-react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { DealerAnalytics } from "@/types/dealer-analytics";

export function TimeToCloseSkeleton() {
  return (
    <div className="h-[300px] w-full animate-pulse rounded-xl border border-white/10 bg-white/[0.04]" aria-hidden data-testid="time-to-close-skeleton" />
  );
}

interface TimeToCloseChartProps {
  timeToClose: DealerAnalytics["timeToClose"];
  loading: boolean;
}

export function TimeToCloseChart({ timeToClose, loading }: TimeToCloseChartProps) {
  const rows = timeToClose.weeklyAverages.map((w) => ({
    week: w.week.slice(5),
    avgDays: w.avgDays,
  }));

  const trendIcon =
    timeToClose.trend === "up" ? (
      <ArrowUpRight className="h-5 w-5 text-amber-400" aria-hidden />
    ) : timeToClose.trend === "down" ? (
      <ArrowDownRight className="h-5 w-5 text-emerald-400" aria-hidden />
    ) : (
      <ArrowRight className="h-5 w-5 text-gray-400" aria-hidden />
    );

  if (loading) {
    return <TimeToCloseSkeleton />;
  }

  if (rows.length === 0) {
    return (
      <p className="text-sm text-gray-500" data-testid="time-to-close-empty">
        Sin puntos para tiempo a cierre.
      </p>
    );
  }

  const trendCopy =
    timeToClose.trend === "up" ? "Tendencia: mayor tiempo medio" : timeToClose.trend === "down" ? "Tendencia: menor tiempo medio" : "Tendencia: estable";

  return (
    <div className="w-full min-w-0 space-y-3" data-testid="time-to-close-chart" role="figure" aria-label={trendCopy}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-wide text-gray-400">Promedio actual</p>
          <p className="text-3xl font-semibold tracking-tight text-white">
            <span aria-hidden>{trendIcon}</span>{" "}
            <span className="align-middle">{timeToClose.currentAvg.toFixed(1)} días</span>
          </p>
        </div>
        <p className="text-sm text-gray-400" aria-live="polite">
          {trendCopy}
        </p>
      </div>
      <ResponsiveContainer width="100%" height={280}>
        <LineChart
          data={rows}
          margin={{ top: 8, right: 8, left: -8, bottom: 0 }}
          accessibilityLayer
          aria-label="Días medio a cierre por semana"
        >
          <CartesianGrid strokeDasharray="4 6" stroke="rgba(255,255,255,0.06)" vertical={false} />
          <XAxis dataKey="week" stroke="#9ca3af" tick={{ fill: "#9ca3af", fontSize: 11 }} />
          <YAxis stroke="#9ca3af" tick={{ fill: "#9ca3af", fontSize: 11 }} width={44} unit=" d" />
          <Tooltip
            contentStyle={{
              borderRadius: 8,
              border: "1px solid rgba(255,255,255,0.12)",
              background: "rgba(10,10,12,0.95)",
            }}
          />
          <Line type="monotone" dataKey="avgDays" name="Días" stroke="#38bdf8" strokeWidth={2} dot={{ r: 3 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
