"use client";

/** Minimal 7-day sparkline — no external chart lib for core cards. */
export function SparklineSvg({ values, color = "#2563eb" }: { values: number[]; color?: string }) {
  const w = 80;
  const h = 28;
  const pts = values.length ? values : [0];
  const min = Math.min(...pts);
  const max = Math.max(...pts);
  const range = max - min || 1;
  const coords = pts
    .map((v, i) => {
      const x = (i / Math.max(pts.length - 1, 1)) * w;
      const y = h - ((v - min) / range) * (h - 4) - 2;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-hidden className="opacity-80">
      <polyline fill="none" stroke={color} strokeWidth="1.5" points={coords} />
    </svg>
  );
}
