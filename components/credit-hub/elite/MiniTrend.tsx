"use client";

import { memo } from "react";
import type { DataTruthLevel } from "@/lib/credit-hub/honesty/data-truth";

const BUCKET_COLORS = ["var(--ch-dealer-accent)", "var(--ch-info)", "var(--ch-warning)", "var(--ch-success)", "var(--ch-danger)"];

export interface MiniTrendProps {
  values: number[];
  /** When true, stroke uses dashed pattern and aria mentions illustrative */
  demo?: boolean;
  color?: string;
  height?: number;
  className?: string;
}

/** Lightweight SVG sparkline — no chart library. */
export const MiniTrend = memo(function MiniTrend({
  values,
  demo = false,
  color = "var(--ch-dealer-accent)",
  height = 32,
  className,
}: MiniTrendProps) {
  const pts = values.length >= 2 ? values : demo ? [3, 5, 4, 7, 6, 8, 7] : [0, 0];
  const w = 72;
  const max = Math.max(...pts, 1);
  const min = Math.min(...pts, 0);
  const range = max - min || 1;
  const coords = pts
    .map((v, i) => {
      const x = (i / (pts.length - 1)) * w;
      const y = height - ((v - min) / range) * (height - 4) - 2;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <svg
      width={w}
      height={height}
      viewBox={`0 0 ${w} ${height}`}
      className={className}
      aria-hidden={!demo}
      aria-label={demo ? "Tendencia ilustrativa demo" : "Microtendencia"}
      style={{ display: "block", flexShrink: 0 }}
    >
      <polyline
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray={demo ? "3 2" : undefined}
        points={coords}
      />
    </svg>
  );
});

export function bucketColor(index: number): string {
  return BUCKET_COLORS[index % BUCKET_COLORS.length] ?? "var(--ch-text-3)";
}

export type { DataTruthLevel };
