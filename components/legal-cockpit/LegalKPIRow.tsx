"use client";

import type { KpiCard } from "@/lib/legal-cockpit/types";
import { KPI_CARDS } from "@/lib/legal-cockpit/calendar-data";

function Sparkline({ points, color }: { points: string; color: string }) {
  return (
    <svg
      viewBox="0 0 100 28"
      className="absolute bottom-2 right-3 opacity-30"
      style={{ width: 72, height: 24 }}
      preserveAspectRatio="none"
    >
      <polyline
        points={points}
        fill="none"
        stroke={`rgb(${color})`}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function LegalKPIRow({ loading }: { loading?: boolean }) {
  if (loading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-24 bg-zinc-900 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {KPI_CARDS.map((card: KpiCard) => (
        <div
          key={card.label}
          className="rounded-xl p-4 relative overflow-hidden"
          style={{
            background: `linear-gradient(135deg, rgba(${card.accentColor},0.12), rgba(${card.accentColor},0.03))`,
            border: `1px solid rgba(${card.accentColor},0.22)`,
          }}
        >
          <p className="text-[10px] font-mono uppercase tracking-widest text-zinc-500 mb-1">
            {card.label}
          </p>
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold text-white">{card.value}</span>
            <span
              className="text-[10px] px-1.5 py-0.5 rounded-full"
              style={{
                background: `rgba(${card.accentColor},0.18)`,
                color: `rgb(${card.accentColor})`,
              }}
            >
              {card.badge}
            </span>
          </div>
          <p className="text-[10px] text-zinc-500 mt-1">{card.sub}</p>
          <Sparkline points={card.sparkPoints} color={card.accentColor} />
        </div>
      ))}
    </div>
  );
}
