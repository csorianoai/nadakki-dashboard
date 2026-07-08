/**
 * Credit Hub Package 0 — icons, formatters, score/risk helpers.
 * Ported from design-system/credit-hub-shell/ch-base.jsx
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
import {
  CH_DEFAULT_CURRENCY_SYMBOL,
  CH_DEFAULT_LOCALE,
} from "./utils/currency";

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

export function chMoney(n: number | null | undefined, cur = CH_DEFAULT_CURRENCY_SYMBOL): string {
  if (n == null) return "—";
  const a = Math.abs(n);
  if (a >= 1e6) {
    return `${cur}${(n / 1e6).toLocaleString(CH_DEFAULT_LOCALE, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}M`;
  }
  if (a >= 1e3) {
    return `${cur}${(n / 1e3).toLocaleString(CH_DEFAULT_LOCALE, { maximumFractionDigits: 0 })}K`;
  }
  return `${cur}${n.toLocaleString(CH_DEFAULT_LOCALE)}`;
}

export function chMoneyExact(n: number | null | undefined, cur = CH_DEFAULT_CURRENCY_SYMBOL): string {
  return `${cur}${(n || 0).toLocaleString(CH_DEFAULT_LOCALE)}`;
}

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

export interface ChScoreBandResult {
  key: string;
  label: string;
  color: string;
  soft: string;
}

/** Score bands aligned with Claude Design (580 / 670 / 740 / 800). */
export function chScoreBand(score: number): ChScoreBandResult {
  if (score < 580) {
    return { key: "critical", label: "Crítico", color: "var(--ch-risk-critical)", soft: "var(--ch-risk-critical-soft)" };
  }
  if (score < 670) {
    return { key: "high", label: "Alto", color: "var(--ch-risk-high)", soft: "var(--ch-risk-high-soft)" };
  }
  if (score < 740) {
    return { key: "medium", label: "Medio", color: "var(--ch-risk-medium)", soft: "var(--ch-risk-medium-soft)" };
  }
  if (score < 800) {
    return { key: "low", label: "Bajo", color: "var(--ch-risk-low)", soft: "var(--ch-risk-low-soft)" };
  }
  return { key: "verylow", label: "Muy bajo", color: "var(--ch-risk-low)", soft: "var(--ch-risk-low-soft)" };
}

export interface ChRiskMeta {
  label: string;
  color: string;
  soft: string;
  description: string;
}

export const RISK: Record<RiskLevel, ChRiskMeta> = {
  low: {
    label: "Bajo",
    color: "var(--ch-risk-low)",
    soft: "var(--ch-risk-low-soft)",
    description: "Perfil dentro de política estándar.",
  },
  medium: {
    label: "Medio",
    color: "var(--ch-risk-medium)",
    soft: "var(--ch-risk-medium-soft)",
    description: "Revisión analítica recomendada.",
  },
  high: {
    label: "Alto",
    color: "var(--ch-risk-high)",
    soft: "var(--ch-risk-high-soft)",
    description: "Ajuste de términos o documentación adicional.",
  },
  critical: {
    label: "Crítico",
    color: "var(--ch-risk-critical)",
    soft: "var(--ch-risk-critical-soft)",
    description: "Rechazo probable sin mitigantes.",
  },
};

export function chPersonaLabel(persona: PersonaType): string {
  return persona === "bank" ? "Portal bancario" : "Portal dealer";
}

export function chPersonaEyebrow(persona: PersonaType): string {
  return persona === "bank" ? "Bank Portal" : "Dealer Portal";
}

/** Gauge geometry helpers (ScoreVisual). */
export function chPolar(cx: number, cy: number, r: number, deg: number): [number, number] {
  const a = ((deg - 90) * Math.PI) / 180;
  return [cx + r * Math.cos(a), cy + r * Math.sin(a)];
}

export function chArcPath(cx: number, cy: number, r: number, startDeg: number, endDeg: number): string {
  const [sx, sy] = chPolar(cx, cy, r, endDeg);
  const [ex, ey] = chPolar(cx, cy, r, startDeg);
  const large = endDeg - startDeg <= 180 ? 0 : 1;
  return `M ${sx.toFixed(2)} ${sy.toFixed(2)} A ${r} ${r} 0 ${large} 0 ${ex.toFixed(2)} ${ey.toFixed(2)}`;
}
