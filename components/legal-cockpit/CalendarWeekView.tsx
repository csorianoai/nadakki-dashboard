"use client";

import type { DayColumn } from "@/lib/legal-cockpit/types";
import { EVENT_STYLES, HOUR_HEIGHT, START_HOUR, END_HOUR } from "@/lib/legal-cockpit/calendar-data";

const HOURS = Array.from({ length: END_HOUR - START_HOUR }, (_, i) => START_HOUR + i);
const GRID_H = (END_HOUR - START_HOUR) * HOUR_HEIGHT;

interface Props {
  days: DayColumn[];
  currentHour: number;
}

export function CalendarWeekView({ days, currentHour }: Props) {
  const nowInRange = currentHour >= START_HOUR && currentHour < END_HOUR;
  const nowTop = (currentHour - START_HOUR) * HOUR_HEIGHT;

  return (
    <div className="rounded-xl border border-zinc-800/60 bg-zinc-950/80 overflow-hidden">
      {/* Day headers */}
      <div className="grid border-b border-zinc-800/40" style={{ gridTemplateColumns: "44px repeat(7, 1fr)" }}>
        <div className="h-12" />
        {days.map((d) => (
          <div key={d.dow} className="flex flex-col items-center justify-center h-12">
            <span className="text-[10px] font-mono tracking-widest" style={{ color: d.today ? "#fff" : "#8E8E98" }}>
              {d.dow}
            </span>
            <span
              className="text-xs font-medium mt-0.5 w-6 h-6 flex items-center justify-center rounded-full"
              style={d.today ? {
                background: "rgba(139,92,246,0.20)",
                border: "1px solid rgba(139,92,246,0.45)",
                color: "#fff",
              } : { color: "#8E8E98" }}
            >
              {d.num}
            </span>
          </div>
        ))}
      </div>

      {/* Grid body */}
      <div className="relative" style={{ display: "grid", gridTemplateColumns: "44px repeat(7, 1fr)" }}>
        {/* Hour labels */}
        <div className="relative" style={{ height: GRID_H }}>
          {HOURS.map((h) => (
            <div
              key={h}
              className="absolute left-0 w-full text-right pr-2 font-mono text-[10px]"
              style={{ top: (h - START_HOUR) * HOUR_HEIGHT, color: "#6A6A73", lineHeight: `${HOUR_HEIGHT}px` }}
            >
              {h > 12 ? `${h - 12}pm` : h === 12 ? "12pm" : `${h}am`}
            </div>
          ))}
          {/* NOW label */}
          {nowInRange && (
            <div
              className="absolute left-0 w-full text-right pr-2 font-mono text-[9px] font-bold"
              style={{ top: nowTop - 6, color: "#FB7185" }}
            >
              AHORA
            </div>
          )}
        </div>

        {/* Day columns */}
        {days.map((d) => (
          <div
            key={d.dow}
            className="relative border-l"
            style={{
              height: GRID_H,
              borderColor: "rgba(255,255,255,0.04)",
              background: d.today ? "rgba(139,92,246,0.04)" : "transparent",
            }}
          >
            {/* Horizontal grid lines */}
            {HOURS.map((h) => (
              <div
                key={h}
                className="absolute left-0 right-0"
                style={{
                  top: (h - START_HOUR) * HOUR_HEIGHT,
                  height: 1,
                  background: "rgba(255,255,255,0.04)",
                }}
              />
            ))}

            {/* Events */}
            {d.events.map((ev) => {
              const s = EVENT_STYLES[ev.type] || EVENT_STYLES.interno;
              const topPx = (ev.start - START_HOUR) * HOUR_HEIGHT;
              const heightPx = ev.dur * HOUR_HEIGHT - 5;

              return (
                <div
                  key={ev.id}
                  className="absolute left-1 right-1 rounded-lg px-2 py-1.5 overflow-hidden cursor-pointer hover:brightness-110 transition-all"
                  style={{
                    top: topPx,
                    height: heightPx,
                    background: s.bg,
                    borderLeft: `3px solid ${ev.conflict ? "#F43F5E" : s.border}`,
                    border: ev.conflict
                      ? `1px dashed rgba(248,113,113,0.34)`
                      : `1px solid transparent`,
                    borderLeftWidth: 3,
                    borderLeftStyle: "solid",
                    borderLeftColor: ev.conflict ? "#F43F5E" : s.border,
                  }}
                >
                  {ev.conflict && (
                    <span className="absolute top-1 right-1 text-[9px] text-amber-400">
                      &#9888;
                    </span>
                  )}
                  <p className="text-[11px] font-medium truncate" style={{ color: s.text }}>
                    {ev.title}
                  </p>
                  <p className="text-[9px] truncate" style={{ color: s.subColor }}>
                    {ev.sub}
                  </p>
                  {ev.city && (
                    <span className="inline-block mt-0.5 text-[8px] px-1 py-0.5 rounded bg-amber-950/40 text-amber-400 border border-amber-800/30">
                      {ev.city}
                    </span>
                  )}
                  {ev.countdown && (
                    <span className="inline-block mt-0.5 text-[8px] px-1 py-0.5 rounded bg-red-950/40 text-red-400">
                      {ev.countdown}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        ))}

        {/* NOW line spanning all columns */}
        {nowInRange && (
          <div
            className="absolute pointer-events-none"
            style={{
              top: nowTop,
              left: 44,
              right: 0,
              height: 2,
              background: "#FB7185",
              zIndex: 10,
            }}
          >
            <div
              className="absolute rounded-full"
              style={{
                width: 8,
                height: 8,
                top: -3,
                left: -4,
                background: "#FB7185",
                boxShadow: "0 0 8px rgba(251,113,133,0.8)",
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
