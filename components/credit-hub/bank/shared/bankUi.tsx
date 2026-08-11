"use client";

import type { ReactNode } from "react";
import { ArrowDown, ArrowRight, ArrowUp, ChevronDown, ChevronUp } from "lucide-react";
import Link from "next/link";
import { ScoreVisual, RiskBand } from "@/components/credit-hub/primitives";
import { chMoney } from "@/lib/credit-hub/ch-base";
import type { BankQueueItem } from "@/lib/credit-hub/types/bankDecision";
import type { BankQueueSortKey } from "@/lib/credit-hub/types/bank-views";
import { chRelTime, PRIORITY_STYLE, STATE_LABEL } from "@/lib/credit-hub/bank/bankFormat";
import { mapBackendRiskLevel } from "@/lib/credit-hub/types/bank-views";
import { formatApplicationStateLabel } from "@/lib/credit-hub/honesty/display-status";

export function SectionHeader({
  eyebrow,
  title,
  sub,
  actions,
}: {
  eyebrow?: string;
  title: string;
  sub?: string;
  actions?: ReactNode;
}) {
  return (
    <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 16, marginBottom: 14 }}>
      <div>
        {eyebrow ? <div className="ch-eyebrow" style={{ marginBottom: 5 }}>{eyebrow}</div> : null}
        <h2 className="ch-serif" style={{ margin: 0, fontSize: 21, letterSpacing: "-0.01em" }}>
          {title}
        </h2>
        {sub ? <div style={{ fontSize: 13, color: "var(--ch-text-3)", marginTop: 3 }}>{sub}</div> : null}
      </div>
      {actions ? <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>{actions}</div> : null}
    </div>
  );
}

export function PriorityBadge({ priority }: { priority: BankQueueItem["priority"] }) {
  const s = PRIORITY_STYLE[priority] ?? PRIORITY_STYLE.BAJA;
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        height: 20,
        padding: "0 8px",
        borderRadius: 999,
        fontSize: 10.5,
        fontWeight: 700,
        letterSpacing: "0.03em",
        color: s.c,
        background: s.bg,
        border: `1px solid ${s.bd}`,
      }}
    >
      <span style={{ width: 5, height: 5, borderRadius: 999, background: "currentColor" }} />
      {priority}
    </span>
  );
}

export function StatePill({ state }: { state: string }) {
  const key = state?.toLowerCase?.() ?? state;
  const queue = STATE_LABEL[key] ?? STATE_LABEL[state];
  const label = queue ? queue[0] : formatApplicationStateLabel(state);
  const tone = queue ? queue[1] : "neutral";
  const map = {
    warning: ["var(--ch-warning-text)", "var(--ch-warning-soft)"],
    info: ["var(--ch-info-text)", "var(--ch-info-soft)"],
    success: ["var(--ch-success-text)", "var(--ch-success-soft)"],
    neutral: ["var(--ch-text-3)", "var(--ch-surface-3)"],
  } as const;
  const [c, bg] = map[tone];
  return (
    <span className="ch-pill" style={{ color: c, background: bg, height: 22, fontSize: 11 }}>
      {label}
    </span>
  );
}

export function KpiCardTrend({
  label,
  value,
  unit,
  trend,
  trendLabel,
  spark,
  sparkColor,
  onClick,
  accent,
}: {
  label: string;
  value: string | number;
  unit?: string;
  trend?: number | null;
  trendLabel?: string;
  spark?: ReactNode;
  sparkColor?: string;
  onClick?: () => void;
  accent?: boolean;
}) {
  const pos = (trend ?? 0) >= 0;
  const Cmp = onClick ? "button" : "div";
  return (
    <Cmp
      type={onClick ? "button" : undefined}
      onClick={onClick}
      className="ch-card"
      style={{
        padding: 16,
        display: "flex",
        flexDirection: "column",
        gap: 9,
        textAlign: "left",
        cursor: onClick ? "pointer" : "default",
        border: "1px solid var(--ch-line)",
        background: "var(--ch-surface)",
        fontFamily: "inherit",
        width: "100%",
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
        <span className="ch-eyebrow">{label}</span>
        {trend != null ? (
          <span className="ch-mono" style={{ fontSize: 11, fontWeight: 600, color: pos ? "var(--ch-success)" : "var(--ch-danger)", display: "inline-flex", alignItems: "center", gap: 2 }}>
            {pos ? <ArrowUp className="h-3 w-3" aria-hidden /> : <ArrowDown className="h-3 w-3" aria-hidden />}
            {Math.abs(trend)}%
          </span>
        ) : null}
      </div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 5 }}>
        <span className="ch-mono" style={{ fontSize: 28, fontWeight: 600, letterSpacing: "-0.02em", lineHeight: 1, color: accent ? "var(--ch-accent)" : "var(--ch-text)" }}>
          {value}
        </span>
        {unit ? <span className="ch-mono" style={{ fontSize: 13, color: "var(--ch-text-3)", fontWeight: 500 }}>{unit}</span> : null}
      </div>
      {spark ? <div style={{ marginTop: "auto" }}>{spark}</div> : null}
      {trendLabel ? <div style={{ fontSize: 11, color: "var(--ch-text-3)" }}>{trendLabel}</div> : null}
    </Cmp>
  );
}

export function AreaMini({ data, w = 240, h = 34, color = "var(--ch-accent-mid)" }: { data: number[]; w?: number; h?: number; color?: string }) {
  if (!data.length) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const rng = max - min || 1;
  const pts = data.map((v, i) => [i / Math.max(data.length - 1, 1) * w, h - ((v - min) / rng) * (h - 4) - 2]);
  const line = pts.map((p, i) => `${i ? "L" : "M"}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" ");
  return (
    <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" style={{ display: "block", width: "100%", height: h }} aria-hidden>
      <path d={`${line} L${w},${h} L0,${h} Z`} fill={color} opacity="0.1" />
      <path d={line} fill="none" stroke={color} strokeWidth="1.5" />
    </svg>
  );
}

export function AreaChart({
  data,
  w = 540,
  h = 200,
  color = "var(--ch-accent-mid)",
  labels,
  fmtY,
}: {
  data: number[];
  w?: number;
  h?: number;
  color?: string;
  labels?: string[];
  fmtY?: (v: number) => string;
}) {
  const pad = { t: 14, r: 14, b: 26, l: 42 };
  const iw = w - pad.l - pad.r;
  const ih = h - pad.t - pad.b;
  const max = Math.max(...data, 1) * 1.12;
  const stepX = iw / Math.max(data.length - 1, 1);
  const y = (v: number) => pad.t + ih - (v / max) * ih;
  const pts = data.map((v, i) => [pad.l + i * stepX, y(v)]);
  const line = pts.map((p, i) => `${i ? "L" : "M"}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" ");
  return (
    <svg viewBox={`0 0 ${w} ${h}`} style={{ width: "100%", height: "auto", display: "block" }} role="img" aria-label="Serie temporal">
      {[0, 0.5, 1].map((t, i) => (
        <g key={i}>
          <line x1={pad.l} x2={w - pad.r} y1={pad.t + ih * t} y2={pad.t + ih * t} stroke="var(--ch-line)" />
          <text x={pad.l - 7} y={pad.t + ih * t + 3} textAnchor="end" fontSize="9.5" fill="var(--ch-text-3)" className="ch-mono">
            {fmtY ? fmtY(max * (1 - t)) : Math.round(max * (1 - t))}
          </text>
        </g>
      ))}
      <path d={`${line} L${pts[pts.length - 1]![0]},${pad.t + ih} L${pts[0]![0]},${pad.t + ih} Z`} fill={color} opacity="0.1" />
      <path d={line} fill="none" stroke={color} strokeWidth="1.75" />
      {labels?.map((l, i) =>
        i % Math.ceil(labels.length / 7) === 0 ? (
          <text key={l} x={pad.l + i * stepX} y={h - 8} textAnchor="middle" fontSize="9.5" fill="var(--ch-text-3)" className="ch-mono">
            {l}
          </text>
        ) : null
      )}
    </svg>
  );
}

export function CohortChart({ cohort, w = 540, h = 220 }: { cohort: Array<{ period: string; applications: number; approval_rate: number }>; w?: number; h?: number }) {
  const pad = { t: 16, r: 44, b: 28, l: 40 };
  const iw = w - pad.l - pad.r;
  const ih = h - pad.t - pad.b;
  const maxA = Math.max(...cohort.map((c) => c.applications), 1) * 1.15;
  const bw = (iw / cohort.length) * 0.52;
  const xC = (i: number) => pad.l + (i + 0.5) * (iw / cohort.length);
  const yA = (v: number) => pad.t + ih - (v / maxA) * ih;
  const yR = (v: number) => pad.t + ih - v * ih;
  const linePts = cohort.map((c, i) => [xC(i), yR(c.approval_rate)]);
  const line = linePts.map((p, i) => `${i ? "L" : "M"}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" ");
  return (
    <svg viewBox={`0 0 ${w} ${h}`} style={{ width: "100%", height: "auto", display: "block" }} role="img" aria-label="Cohorte: solicitudes y tasa de aprobación">
      {[0, 0.25, 0.5, 0.75, 1].map((t, i) => (
        <line key={i} x1={pad.l} x2={w - pad.r} y1={pad.t + ih * t} y2={pad.t + ih * t} stroke="var(--ch-line)" />
      ))}
      {cohort.map((c, i) => (
        <g key={c.period}>
          <rect x={xC(i) - bw / 2} y={yA(c.applications)} width={bw} height={pad.t + ih - yA(c.applications)} rx="2" fill="var(--ch-persona-soft)" stroke="var(--ch-persona)" strokeWidth="1" />
          <text x={xC(i)} y={h - 9} textAnchor="middle" fontSize="9.5" fill="var(--ch-text-3)" className="ch-mono">
            {c.period.slice(5)}
          </text>
        </g>
      ))}
      <path d={line} fill="none" stroke="var(--ch-accent-strong)" strokeWidth="2" />
      {linePts.map((p, i) => (
        <circle key={i} cx={p[0]} cy={p[1]} r="3" fill="var(--ch-surface)" stroke="var(--ch-accent-strong)" strokeWidth="2" />
      ))}
    </svg>
  );
}

export function BankSegment({
  value,
  options,
  onChange,
}: {
  value: string;
  options: Array<{ v: string; l: string }>;
  onChange: (v: string) => void;
}) {
  return (
    <div className="ch-seg" style={{ display: "inline-flex", background: "var(--ch-surface-2)", border: "1px solid var(--ch-line)", borderRadius: "var(--ch-r-md)", padding: 2, gap: 2 }}>
      {options.map((o) => (
        <button
          key={o.v}
          type="button"
          onClick={() => onChange(o.v)}
          style={{
            height: 24,
            padding: "0 10px",
            border: "none",
            borderRadius: 4,
            fontFamily: "inherit",
            fontSize: 12,
            fontWeight: 500,
            cursor: "pointer",
            background: value === o.v ? "var(--ch-surface)" : "transparent",
            color: value === o.v ? "var(--ch-text)" : "var(--ch-text-3)",
            boxShadow: value === o.v ? "var(--ch-sh-1)" : "none",
            whiteSpace: "nowrap",
          }}
        >
          {o.l}
        </button>
      ))}
    </div>
  );
}

export function QueueTable({
  items,
  variant = "dashboard",
  selectable = false,
  selected,
  onToggle,
  onToggleAll,
  sortKey,
  sortDir,
  onSort,
  detailHref,
}: {
  items: BankQueueItem[];
  variant?: "dashboard" | "list";
  selectable?: boolean;
  selected?: Set<string>;
  onToggle?: (id: string) => void;
  onToggleAll?: () => void;
  sortKey?: BankQueueSortKey;
  sortDir?: "asc" | "desc";
  onSort?: (k: BankQueueSortKey) => void;
  detailHref?: (id: string) => string;
}) {
  const isList = variant === "list";
  const allChecked = selectable && selected && items.length > 0 && items.every((i) => selected.has(i.application_id));

  function SortTh({ k, children, num }: { k: BankQueueSortKey; children: ReactNode; num?: boolean }) {
    return (
      <th className={num ? "ch-num" : ""} style={{ cursor: onSort ? "pointer" : "default", userSelect: "none" }} onClick={() => onSort?.(k)}>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 4, justifyContent: num ? "flex-end" : "flex-start" }}>
          {children}
          {sortKey === k ? sortDir === "asc" ? <ChevronUp className="h-3 w-3" aria-hidden /> : <ChevronDown className="h-3 w-3" aria-hidden /> : null}
        </span>
      </th>
    );
  }

  return (
    <table className="ch-table">
      <thead>
        <tr>
          {selectable ? (
            <th style={{ width: 34 }}>
              <input type="checkbox" checked={!!allChecked} onChange={onToggleAll} style={{ margin: 0, accentColor: "var(--ch-accent-mid)" }} aria-label="Seleccionar todas" />
            </th>
          ) : null}
          {onSort ? <SortTh k="priority">Prioridad</SortTh> : <th>Prioridad</th>}
          {onSort ? <SortTh k="applicant_name">Solicitante</SortTh> : <th>Solicitante</th>}
          <th>Concesionario</th>
          <th>Vehículo</th>
          {onSort ? <SortTh k="requested_amount" num>Monto</SortTh> : <th className="ch-num">Monto</th>}
          {onSort ? <SortTh k="score" num>Score</SortTh> : <th className="ch-num">Score</th>}
          <th>Riesgo</th>
          {isList ? <th>Estado</th> : null}
          {onSort ? <SortTh k="created_at">Recibida</SortTh> : <th>Recibida</th>}
          <th style={{ width: isList ? 44 : 88 }} />
        </tr>
      </thead>
      <tbody>
        {items.map((a) => {
          const sel = selectable && selected?.has(a.application_id);
          const href = detailHref?.(a.application_id) ?? `/credit-hub/bank/applications/${a.application_id}`;
          return (
            <tr key={a.application_id} className="ch-click" style={sel ? { background: "var(--ch-accent-soft)" } : undefined}>
              {selectable ? (
                <td onClick={(e) => e.stopPropagation()}>
                  <input type="checkbox" checked={!!sel} onChange={() => onToggle?.(a.application_id)} style={{ margin: 0, accentColor: "var(--ch-accent-mid)" }} aria-label={`Seleccionar ${a.application_id}`} />
                </td>
              ) : null}
              <td>
                <PriorityBadge priority={a.priority} />
              </td>
              <td>
                <div style={{ fontWeight: 600 }}>{a.applicant_name ?? "—"}</div>
                <div className="ch-mono" style={{ fontSize: 10.5, color: "var(--ch-text-3)" }}>
                  {a.application_id}
                </div>
              </td>
              <td style={{ color: "var(--ch-text-2)" }}>{a.dealer_name ?? "—"}</td>
              <td style={{ color: "var(--ch-text-2)" }}>{a.vehicle_label ?? "—"}</td>
              <td className="ch-num">{chMoney(a.requested_amount)}</td>
              <td className="ch-num">
                <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: 7 }}>
                  <span style={{ fontWeight: 600 }}>{a.score}</span>
                  <ScoreVisual score={a.score} size={28} thickness={3.5} label={false} />
                </div>
              </td>
              <td>
                <RiskBand level={mapBackendRiskLevel(a.risk_level)} size="sm" />
              </td>
              {isList ? (
                <td>
                  <StatePill state={a.state} />
                </td>
              ) : null}
              <td className="ch-mono" style={{ fontSize: 11, color: "var(--ch-text-3)" }}>
                {chRelTime(a.created_at)}
              </td>
              <td onClick={(e) => e.stopPropagation()}>
                {isList ? (
                  <Link href={href} className="ch-icon-btn" style={{ width: 28, height: 28, display: "inline-flex" }} title="Abrir">
                    <ArrowRight className="h-4 w-4" aria-hidden />
                  </Link>
                ) : (
                  <Link href={href} className="ch-btn ch-btn-secondary ch-btn-sm">
                    Revisar
                  </Link>
                )}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
