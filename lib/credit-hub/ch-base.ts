/**
 * Credit Hub Package 0 — icons, formatters, score/risk helpers.
 */

import type { LucideIcon } from "lucide-react";
import {
  AlertTriangle,
  BarChart3,
  Bell,
  Building2,
  Calculator,
  CheckCircle2,
  ClipboardList,
  FileText,
  Gauge,
  History,
  Home,
  Plus,
  Search,
  ShieldCheck,
  User,
  XCircle,
} from "lucide-react";
import type { PersonaType, RiskLevel } from "./ch-types";

export const CH_ICONS = {
  AlertTriangle,
  BarChart3,
  Bell,
  Building2,
  Calculator,
  CheckCircle2,
  ClipboardList,
  FileText,
  Gauge,
  History,
  Home,
  Plus,
  Search,
  ShieldCheck,
  User,
  XCircle,
} as const satisfies Record<string, LucideIcon>;

export function chFormatCurrency(value: number, locale = "es-DO", currency = "DOP"): string {
  return new Intl.NumberFormat(locale, { style: "currency", currency, maximumFractionDigits: 0 }).format(value || 0);
}

export function chFormatPercent(value: number, locale = "es-DO", digits = 1): string {
  return new Intl.NumberFormat(locale, { style: "percent", maximumFractionDigits: digits }).format(value);
}

export function chFormatDate(iso: string, locale = "es-DO"): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short" }).format(d);
}

export interface ChScoreBand {
  label: string;
  tone: "success" | "warning" | "danger" | "neutral";
  cssClass: string;
}

export function chScoreBand(score: number, min = 300, max = 900): ChScoreBand {
  const normalized = Math.max(min, Math.min(max, score));
  const pct = (normalized - min) / (max - min);
  if (pct >= 0.72) return { label: "Excelente", tone: "success", cssClass: "ch-pill-low" };
  if (pct >= 0.55) return { label: "Aceptable", tone: "warning", cssClass: "ch-pill-medium" };
  if (pct >= 0.4) return { label: "Limítrofe", tone: "warning", cssClass: "ch-pill-high" };
  return { label: "Alto riesgo", tone: "danger", cssClass: "ch-pill-critical" };
}

export interface ChRiskBandMeta {
  label: string;
  cssClass: string;
  description: string;
}

export const CH_RISK_BAND: Record<RiskLevel, ChRiskBandMeta> = {
  low: { label: "Bajo", cssClass: "ch-pill-low", description: "Perfil dentro de política estándar." },
  medium: { label: "Medio", cssClass: "ch-pill-medium", description: "Revisión analítica recomendada." },
  high: { label: "Alto", cssClass: "ch-pill-high", description: "Ajuste de términos o documentación adicional." },
  critical: { label: "Crítico", cssClass: "ch-pill-critical", description: "Rechazo probable sin mitigantes." },
};

export function chPersonaLabel(persona: PersonaType): string {
  return persona === "bank" ? "Portal bancario" : "Portal dealer";
}

export function chPersonaEyebrow(persona: PersonaType): string {
  return persona === "bank" ? "Bank Portal" : "Dealer Portal";
}
