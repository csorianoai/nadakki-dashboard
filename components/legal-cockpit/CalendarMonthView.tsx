"use client";

import { MONTH_EVENT_DOTS } from "@/lib/legal-cockpit/calendar-data";

const DOW_LABELS = ["LUN", "MAR", "MIÉ", "JUE", "VIE", "SÁB", "DOM"];

// March 2026 starts on Sunday → offset 6 (mon-first: Sun is index 6)
const MONTH_OFFSET = 6;
const DAYS_IN_MONTH = 31;
const TODAY = 24;
const VISIBLE_START = 23;
const VISIBLE_END = 29;

function buildGrid(): (number | null)[] {
  const cells: (number | null)[] = [];
  for (let i = 0; i < MONTH_OFFSET; i++) cells.push(null);
  for (let d = 1; d <= DAYS_IN_MONTH; d++) cells.push(d);
  while (cells.length < 42) cells.push(null);
  return cells;
}

export function CalendarMonthView() {
  const grid = buildGrid();

  return (
    <div className="rounded-xl border border-zinc-800/60 bg-zinc-950/80 p-3">
      {/* DOW header */}
      <div className="grid grid-cols-7 mb-1">
        {DOW_LABELS.map((d) => (
          <div key={d} className="text-center text-[9px] font-mono tracking-widest py-1" style={{ color: "#6A6A73" }}>
            {d}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {grid.map((day, i) => {
          if (day === null) {
            return (
              <div
                key={`e${i}`}
                className="rounded-lg"
                style={{ height: 64, border: "1px solid rgba(255,255,255,0.04)" }}
              />
            );
          }

          const isToday = day === TODAY;
          const inVisibleWeek = day >= VISIBLE_START && day <= VISIBLE_END;
          const dots = MONTH_EVENT_DOTS[day] || [];

          let bg = "transparent";
          let borderColor = "rgba(255,255,255,0.04)";
          let textColor = "#C2C4CB";

          if (isToday) {
            bg = "rgba(139,92,246,0.16)";
            borderColor = "rgba(139,92,246,0.42)";
            textColor = "#D6CCFF";
          } else if (inVisibleWeek) {
            bg = "rgba(139,92,246,0.04)";
            borderColor = "rgba(255,255,255,0.05)";
          }

          return (
            <div
              key={day}
              className="rounded-lg relative flex flex-col justify-between p-1.5"
              style={{ height: 64, background: bg, border: `1px solid ${borderColor}` }}
            >
              <span className="text-[11px] font-medium" style={{ color: textColor }}>
                {day}
              </span>
              {dots.length > 0 && (
                <div className="flex gap-1">
                  {dots.map((c, j) => (
                    <span
                      key={j}
                      className="rounded-full"
                      style={{ width: 6, height: 6, background: c }}
                    />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
