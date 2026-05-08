"use client";

import { daysUntil } from "@/lib/legal/cases/deadline-formatter";

/** Urgencia textual para countdown visual en filas densas de expedientes. */

export type DeadlineTone = "expired" | "critical" | "soon" | "calm" | "none";

export interface DeadlineCountdownParts {
  tone: DeadlineTone;
  label: string;
  days: number | null;
  textClass: string;
}

function toneClass(tone: DeadlineTone): string {
  switch (tone) {
    case "expired":
      return "text-red-400";
    case "critical":
      return "text-red-300 animate-pulse";
    case "soon":
      return "text-amber-300";
    case "calm":
      return "text-zinc-400";
    default:
      return "text-zinc-500";
  }
}

export function useDeadlineCountdown(isoDate?: string, status?: string): DeadlineCountdownParts | null {
  if (!isoDate || status !== "active") {
    return null;
  }
  const days = daysUntil(isoDate);
  let tone: DeadlineTone;
  let label: string;

  if (days < 0) {
    tone = "expired";
    const abs = Math.abs(days);
    label = `vencido hace ${abs} día${abs === 1 ? "" : "s"}`;
  } else if (days === 0) {
    tone = "critical";
    label = "vence hoy";
  } else if (days === 1) {
    tone = "critical";
    label = "vence mañana";
  } else if (days < 3) {
    tone = "critical";
    label = `en ${days} días`;
  } else if (days < 7) {
    tone = "soon";
    label = `en ${days} días`;
  } else if (days < 30) {
    tone = "calm";
    label = `en ${days} días`;
  } else {
    tone = "calm";
    label = new Date(`${isoDate}T12:00:00`).toLocaleDateString("es-DO");
  }

  return {
    tone,
    label,
    days,
    textClass: `tabular-nums font-medium ${toneClass(tone)}`,
  };
}
