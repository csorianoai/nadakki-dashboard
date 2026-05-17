"use client";

import { useEffect, useMemo, useState } from "react";

export interface SlaCountdownProps {
  hoursUntilSla: number;
}

/** SLA remainder with reduced-motion friendly presentation */
export function SlaCountdown({ hoursUntilSla }: SlaCountdownProps) {
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
      setReduceMotion(false);
      return;
    }
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduceMotion(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  const label = useMemo(() => {
    if (!Number.isFinite(hoursUntilSla)) return "—";
    if (hoursUntilSla < 0) return "Vencido";
    const h = Math.floor(hoursUntilSla);
    const m = Math.round((hoursUntilSla - h) * 60);
    if (h >= 72) return `${Math.round(hoursUntilSla / 24)}d`;
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m`;
  }, [hoursUntilSla]);

  const overdue = Number.isFinite(hoursUntilSla) && hoursUntilSla < 0;

  return (
    <span
      className={`inline-flex items-center rounded-md px-2 py-1 font-forgeMono text-forge-xs tabular-nums ring-1 ring-inset ${
        overdue
          ? "bg-rose-50 text-rose-950 ring-rose-300"
          : "bg-forgeGray-50 text-forgeGray-800 ring-forgeGray-200"
      } ${!reduceMotion && overdue ? "animate-pulse" : ""}`}
      data-testid="sla-countdown"
      data-overdue={overdue ? "true" : "false"}
    >
      {label}
    </span>
  );
}
