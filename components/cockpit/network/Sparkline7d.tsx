"use client";

export function Sparkline7d({ values, color }: { values: number[]; color: string }) {
  const pts = values.length ? values : [0];
  const w = 100;
  const h = 30;
  const min = Math.min(...pts);
  const max = Math.max(...pts);
  const range = max - min || 1;
  const line = pts
    .map((v, i) => {
      const x = (i / Math.max(pts.length - 1, 1)) * w;
      const y = h - ((v - min) / range) * (h - 6) - 3;
      return `${x},${y}`;
    })
    .join(" ");
  const area = `${line} L${w},${h} L0,${h} Z`;

  return (
    <div className="flex items-end gap-2">
      <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="shrink-0" aria-hidden>
        <path d={area} fill={color} fillOpacity={0.15} />
        <polyline fill="none" stroke={color} strokeWidth="1.5" points={line} />
      </svg>
      <span className="text-[10px] text-cockpit-muted">últimos 7 días</span>
    </div>
  );
}
