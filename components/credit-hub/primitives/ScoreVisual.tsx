"use client";

import { useMemo } from "react";
import { chArcPath, chPolar, chScoreBand } from "@/lib/credit-hub/ch-base";
import type { ScoreVisualProps } from "@/lib/credit-hub/ch-types";

const START = 135;
const SWEEP = 270;

export function ScoreVisual({
  score = 720,
  min = 300,
  max = 850,
  size = 168,
  thickness = 12,
  label = true,
}: ScoreVisualProps) {
  const band = chScoreBand(score);
  const frac = Math.max(0, Math.min(1, (score - min) / (max - min)));
  const valEnd = START + SWEEP * frac;
  const c = size / 2;
  const r = (size - thickness) / 2 - 6;
  const [px, py] = chPolar(c, c, r, valEnd);

  const ariaLabel = useMemo(
    () => `Score ${score}, riesgo ${band.label}`,
    [band.label, score]
  );

  return (
    <div style={{ position: "relative", width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label={ariaLabel}>
        <path
          d={chArcPath(c, c, r, START, START + SWEEP)}
          fill="none"
          stroke="var(--ch-surface-3)"
          strokeWidth={thickness}
          strokeLinecap="round"
        />
        <path
          d={chArcPath(c, c, r, START, valEnd)}
          fill="none"
          stroke={band.color}
          strokeWidth={thickness}
          strokeLinecap="round"
        />
        <circle cx={px} cy={py} r={thickness / 2 + 2} fill="var(--ch-surface)" stroke={band.color} strokeWidth="2.5" />
      </svg>
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div className="ch-mono" style={{ fontSize: size * 0.27, fontWeight: 600, lineHeight: 1, color: "var(--ch-text)" }}>
          {score}
        </div>
        {label ? (
          <div
            style={{
              marginTop: 6,
              fontSize: 11,
              fontWeight: 600,
              color: band.color,
              display: "flex",
              alignItems: "center",
              gap: 5,
            }}
          >
            <span style={{ width: 7, height: 7, borderRadius: 999, background: band.color }} />
            Riesgo {band.label.toLowerCase()}
          </div>
        ) : null}
      </div>
      {label ? (
        <div
          className="ch-mono"
          style={{
            position: "absolute",
            bottom: size * 0.06,
            width: "100%",
            display: "flex",
            justifyContent: "space-between",
            padding: "0 14px",
            fontSize: 9.5,
            color: "var(--ch-text-4)",
          }}
        >
          <span>{min}</span>
          <span>{max}</span>
        </div>
      ) : null}
    </div>
  );
}
