"use client";

import { useSyncExternalStore } from "react";
import { Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { cn } from "@/lib/utils";

function reducedMotionSubscribe(onStoreChange: () => void) {
  const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
  mq.addEventListener("change", onStoreChange);
  return () => mq.removeEventListener("change", onStoreChange);
}

function reducedMotionSnapshot(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function usePrefersReducedMotion(): boolean {
  return useSyncExternalStore(reducedMotionSubscribe, reducedMotionSnapshot, () => false);
}

export type MicroChartRow = Record<string, string | number | undefined>;

export interface MicroChartProps {
  title: string;
  data: MicroChartRow[];
  lineKeys: string[];
  colors: string[];
  xKey?: string;
  /** Legend labels aligned with `lineKeys` (defaults to keys). */
  lineLabels?: string[];
  className?: string;
  yTickFormatter?: (value: number) => string;
}

export function MicroChart({
  title,
  data,
  lineKeys,
  colors,
  xKey = "label",
  lineLabels,
  className,
  yTickFormatter,
}: MicroChartProps) {
  const reducedMotion = usePrefersReducedMotion();
  const duration = reducedMotion ? 0 : 400;
  const labels = lineLabels ?? lineKeys;

  if (data.length === 0) {
    return (
      <div className={cn("rounded-forge-md border border-forgeInk-200 bg-forgeSurface-card p-4", className)}>
        <p className="font-sans text-[14px] font-medium text-forgeInk-700">{title}</p>
        <p className="mt-4 text-forge-sm text-forgeInk-500">Sin datos</p>
      </div>
    );
  }

  return (
    <div className={cn("rounded-forge-md border border-forgeInk-200 bg-forgeSurface-card p-4 shadow-forge-xs", className)}>
      <p className="font-sans text-[14px] font-medium text-forgeInk-700">{title}</p>
      <div className="mt-3 h-[200px] w-full min-w-0">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
            <XAxis
              dataKey={xKey}
              tick={{ fontSize: 11, fill: "var(--forge-ink-500)" }}
              axisLine={false}
              tickLine={false}
              interval="preserveStartEnd"
            />
            <YAxis
              width={40}
              tick={{ fontSize: 11, fill: "var(--forge-ink-500)" }}
              axisLine={false}
              tickLine={false}
              tickFormatter={yTickFormatter}
            />
            <Tooltip
              isAnimationActive={false}
              contentStyle={{
                borderRadius: 8,
                border: "1px solid var(--forge-ink-200)",
                fontSize: 12,
                background: "var(--forge-surface-card)",
                color: "var(--forge-ink-800)",
              }}
            />
            <Legend
              wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
              formatter={(value) => <span className="text-forgeInk-600">{String(value)}</span>}
            />
            {lineKeys.map((key, idx) => (
              <Line
                key={key}
                type="monotone"
                dataKey={key}
                name={labels[idx]}
                stroke={colors[idx] ?? "var(--forge-brand-500)"}
                strokeWidth={2}
                dot={false}
                isAnimationActive={duration > 0}
                animationDuration={duration}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
