"use client";

import type { ReactNode } from "react";
import { fmtLocal } from "../lib/formatters";
import type { MarketTrendPoint } from "../lib/market-trend";

export interface HBarDatum {
  label: string;
  value: number;
  pct?: number;
  color: string;
  raw?: unknown;
}

interface HBarProps {
  data: HBarDatum[];
  cur: string;
  onPick?: (d: HBarDatum) => void;
  valueFmt?: (value: number) => string;
}

export function HBar({ data, cur, onPick, valueFmt }: HBarProps) {
  if (!data.length) return null;

  const max = Math.max(...data.map((d) => d.value));
  if (!Number.isFinite(max) || max <= 0) return null;

  return (
    <div
      role="img"
      aria-label="Ranking de instituciones por cartera"
      style={{ display: "flex", flexDirection: "column" }}
    >
      {data.map((d, i) => (
        <button
          key={i}
          type="button"
          onClick={() => onPick?.(d)}
          className="hbar-row"
          style={{
            display: "grid",
            gridTemplateColumns: "168px 1fr 124px",
            gap: 12,
            alignItems: "center",
            padding: "9px 4px",
            border: "none",
            borderBottom: i < data.length - 1 ? "1px solid var(--mee-line)" : "none",
            background: "transparent",
            cursor: onPick ? "pointer" : "default",
            textAlign: "left",
            fontFamily: "inherit",
            width: "100%",
          }}
          onMouseEnter={(e) => {
            if (onPick) e.currentTarget.style.background = "var(--mee-surface-2)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "transparent";
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
            <span
              style={{
                width: 7,
                height: 7,
                borderRadius: 2,
                background: d.color,
                flexShrink: 0,
              }}
            />
            <span
              style={{
                fontSize: 12.5,
                fontWeight: 500,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {d.label}
            </span>
          </div>
          <div
            style={{
              height: 18,
              background: "var(--mee-surface-2)",
              borderRadius: 3,
              position: "relative",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                position: "absolute",
                inset: 0,
                width: `${(d.value / max) * 100}%`,
                background: d.color,
                borderRadius: 3,
                transition: "width 600ms cubic-bezier(.2,.8,.2,1)",
              }}
            />
          </div>
          <div style={{ textAlign: "right" }}>
            <span className="mono" style={{ fontSize: 12.5, fontWeight: 600 }}>
              {valueFmt ? valueFmt(d.value) : fmtLocal(d.value, cur)}
            </span>
            {d.pct != null && (
              <span
                className="mono"
                style={{ fontSize: 11, color: "var(--mee-ink-3)", marginLeft: 6 }}
              >
                {d.pct}%
              </span>
            )}
          </div>
        </button>
      ))}
    </div>
  );
}

export interface DonutDatum {
  label: string;
  value: number;
  color: string;
}

interface DonutProps {
  data: DonutDatum[];
  size?: number;
  thickness?: number;
  centerValue?: ReactNode;
  centerLabel?: string;
}

export function Donut({
  data,
  size = 168,
  thickness = 22,
  centerValue,
  centerLabel,
}: DonutProps) {
  if (!data.length) return null;

  const total = data.reduce((s, d) => s + d.value, 0);
  if (!Number.isFinite(total) || total <= 0) return null;

  const r = (size - thickness) / 2;
  const c = size / 2;
  const circ = 2 * Math.PI * r;
  let acc = 0;

  return (
    <div style={{ position: "relative", width: size, height: size }}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        role="img"
        aria-label="Distribución porcentual"
      >
        <circle
          cx={c}
          cy={c}
          r={r}
          fill="none"
          stroke="var(--mee-surface-3)"
          strokeWidth={thickness}
        />
        {data.map((d, i) => {
          const len = (d.value / total) * circ;
          const off = -acc;
          acc += len;
          return (
            <circle
              key={i}
              cx={c}
              cy={c}
              r={r}
              fill="none"
              stroke={d.color}
              strokeWidth={thickness}
              strokeDasharray={`${len} ${circ - len}`}
              strokeDashoffset={off}
              transform={`rotate(-90 ${c} ${c})`}
            />
          );
        })}
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
        <div className="mono" style={{ fontSize: 26, fontWeight: 600 }}>
          {centerValue}
        </div>
        {centerLabel && (
          <div className="eyebrow" style={{ marginTop: 2 }}>
            {centerLabel}
          </div>
        )}
      </div>
    </div>
  );
}

interface MarketTrendProps {
  data: MarketTrendPoint[];
  cur: string;
  w?: number;
  h?: number;
}

function MarketTrendPlaceholder({ w = 520, h = 220 }: { w?: number; h?: number }) {
  const pad = { t: 16, r: 44, b: 28, l: 52 };
  const iw = w - pad.l - pad.r;
  const ih = h - pad.t - pad.b;
  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      style={{ width: "100%", height: "auto", display: "block" }}
      role="img"
      aria-label="Sin datos de tendencia de mercado"
    >
      {[0, 0.25, 0.5, 0.75, 1].map((t, i) => (
        <line
          key={i}
          x1={pad.l}
          x2={w - pad.r}
          y1={pad.t + ih * t}
          y2={pad.t + ih * t}
          stroke="var(--mee-line)"
          strokeWidth="1"
        />
      ))}
      <text
        x={pad.l + iw / 2}
        y={pad.t + ih / 2}
        textAnchor="middle"
        fontSize="11"
        fill="var(--mee-ink-4)"
      >
        Sin datos
      </text>
    </svg>
  );
}

export function MarketTrend({ data, cur, w = 520, h = 220 }: MarketTrendProps) {
  if (!data.length) {
    return <MarketTrendPlaceholder w={w} h={h} />;
  }

  const pad = { t: 16, r: 44, b: 28, l: 52 };
  const iw = w - pad.l - pad.r;
  const ih = h - pad.t - pad.b;
  const maxS = Math.max(...data.map((d) => d.size)) * 1.1;
  const maxG = Math.max(...data.map((d) => d.growth)) * 1.3;
  const bw = (iw / data.length) * 0.5;
  const xC = (i: number) => pad.l + (i + 0.5) * (iw / data.length);
  const yS = (v: number) => pad.t + ih - (v / maxS) * ih;
  const yG = (v: number) => pad.t + ih - (v / maxG) * ih;
  const linePts = data.map((d, i) => [xC(i), yG(d.growth)] as const);
  const line = linePts
    .map((p, i) => `${i ? "L" : "M"}${p[0].toFixed(1)},${p[1].toFixed(1)}`)
    .join(" ");

  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      style={{ width: "100%", height: "auto", display: "block" }}
      role="img"
      aria-label="Tamaño de mercado y crecimiento anual"
    >
      {[0, 0.25, 0.5, 0.75, 1].map((t, i) => (
        <g key={i}>
          <line
            x1={pad.l}
            x2={w - pad.r}
            y1={pad.t + ih * t}
            y2={pad.t + ih * t}
            stroke="var(--mee-line)"
            strokeWidth="1"
          />
          <text
            x={pad.l - 8}
            y={pad.t + ih * t + 3}
            textAnchor="end"
            fontSize="9.5"
            fill="var(--mee-ink-3)"
            className="mono"
          >
            {fmtLocal(maxS * (1 - t), cur).replace(cur, "")}
          </text>
        </g>
      ))}
      {data.map((d, i) => (
        <g key={i}>
          <rect
            x={xC(i) - bw / 2}
            y={yS(d.size)}
            width={bw}
            height={pad.t + ih - yS(d.size)}
            rx="2"
            fill="var(--mee-accent-line)"
          />
          <text
            x={xC(i)}
            y={h - 9}
            textAnchor="middle"
            fontSize="10"
            fill="var(--mee-ink-3)"
            className="mono"
          >
            {d.year}
          </text>
        </g>
      ))}
      <path d={line} fill="none" stroke="var(--mee-accent-strong)" strokeWidth="2" />
      {linePts.map((p, i) => (
        <circle
          key={i}
          cx={p[0]}
          cy={p[1]}
          r="3"
          fill="var(--mee-surface)"
          stroke="var(--mee-accent-strong)"
          strokeWidth="2"
        />
      ))}
      {data.map((d, i) => (
        <text
          key={i}
          x={xC(i)}
          y={yG(d.growth) - 9}
          textAnchor="middle"
          fontSize="9.5"
          fill="var(--mee-accent-strong)"
          className="mono"
          fontWeight="600"
        >
          {d.growth}%
        </text>
      ))}
    </svg>
  );
}

export interface StackBarSegment {
  label: string;
  value: number;
  color: string;
}

interface StackBarProps {
  segments: StackBarSegment[];
  height?: number;
}

export function StackBar({ segments, height = 10 }: StackBarProps) {
  if (!segments.length) return null;

  const total = segments.reduce((s, d) => s + d.value, 0);
  if (!Number.isFinite(total) || total <= 0) return null;

  return (
    <div
      style={{
        display: "flex",
        height,
        borderRadius: 5,
        overflow: "hidden",
        background: "var(--mee-surface-3)",
      }}
    >
      {segments.map((s, i) => (
        <div
          key={i}
          title={`${s.label}: ${s.value}`}
          style={{ width: `${(s.value / total) * 100}%`, background: s.color }}
        />
      ))}
    </div>
  );
}
