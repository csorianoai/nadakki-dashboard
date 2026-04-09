"use client";

import type { ReactNode } from "react";

function numScore(raw: unknown): number | null {
  if (raw == null || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const n =
    o.score != null
      ? Number(o.score)
      : o.Score != null
        ? Number(o.Score)
        : null;
  return n != null && Number.isFinite(n) ? n : null;
}

function decisionBadge(raw: unknown): {
  text: string;
  className: string;
} {
  const d =
    raw != null && typeof raw === "object" && "decision" in raw
      ? String((raw as Record<string, unknown>).decision ?? "")
      : "";
  const r =
    raw != null && typeof raw === "object" && "recommendation" in raw
      ? String((raw as Record<string, unknown>).recommendation ?? "")
      : "";
  const u = (d || r).toUpperCase();
  if (u.includes("APPROVE") || u.includes("APROB")) {
    return { text: "Aprobado", className: "bg-emerald-500/20 text-emerald-200" };
  }
  if (u.includes("REVIEW") || u.includes("REVIS")) {
    return { text: "En Revisión", className: "bg-amber-500/20 text-amber-200" };
  }
  if (u.includes("DECLINE") || u.includes("RECHAZ")) {
    return { text: "Rechazado", className: "bg-red-500/20 text-red-200" };
  }
  if (!u) {
    return { text: "Pendiente", className: "bg-slate-600/40 text-slate-400" };
  }
  return { text: u.slice(0, 24), className: "bg-slate-600/30 text-slate-300" };
}

function scoreColor(score: number | null): string {
  if (score == null) return "text-slate-500";
  if (score > 700) return "text-emerald-400";
  if (score >= 500) return "text-amber-400";
  return "text-red-400";
}

function topDriver(explanation: unknown): string {
  if (explanation == null) return "Sin datos";
  const ex = explanation as Record<string, unknown>;
  const pd = ex.positive_drivers;
  if (Array.isArray(pd) && pd[0] && typeof pd[0] === "object") {
    const f = (pd[0] as Record<string, unknown>).factor;
    if (typeof f === "string") return f;
  }
  const factors = ex.factors;
  if (Array.isArray(factors) && factors[0] && typeof factors[0] === "object") {
    const row = factors[0] as Record<string, unknown>;
    const hf = row.human_factor ?? row.factor;
    if (typeof hf === "string") return hf;
  }
  return "Sin datos";
}

function bestAction(opt: unknown): string {
  if (opt == null) return "Sin recomendación";
  const o = opt as Record<string, unknown>;
  const ba = o.best_actions;
  if (Array.isArray(ba) && ba[0] && typeof ba[0] === "object") {
    const a = (ba[0] as Record<string, unknown>).action;
    if (typeof a === "string") return a;
  }
  const ta = o.top_actions;
  if (Array.isArray(ta) && ta[0] && typeof ta[0] === "object") {
    const t = ta[0] as Record<string, unknown>;
    const label = t.action ?? t.title ?? t.description;
    if (typeof label === "string") return label;
  }
  return "Sin recomendación";
}

function bestOfferLines(ranking: unknown): {
  bank: string;
  quota: string | null;
} {
  if (ranking == null || typeof ranking !== "object") {
    return { bank: "Sin ofertas", quota: null };
  }
  const r = ranking as Record<string, unknown>;
  const bo = r.best_overall;
  if (!bo || typeof bo !== "object") {
    return { bank: "Sin ofertas", quota: null };
  }
  const b = bo as Record<string, unknown>;
  const bank = String(
    b.banco_nombre ?? b.lender_name ?? b.bank_name ?? "—"
  );
  const cuota =
    b.cuota_total != null
      ? Number(b.cuota_total)
      : b.monthly_payment != null
        ? Number(b.monthly_payment)
        : null;
  const quota =
    cuota != null && Number.isFinite(cuota)
      ? `RD$ ${cuota.toLocaleString("es-DO", { maximumFractionDigits: 0 })}/mes`
      : null;
  return { bank, quota };
}

export interface ExecutiveSummaryCardProps {
  explanation?: unknown;
  optimize?: unknown;
  ranking?: unknown;
}

export function ExecutiveSummaryCard({
  explanation,
  optimize,
  ranking,
}: ExecutiveSummaryCardProps) {
  const score = numScore(explanation);
  const badge = decisionBadge(explanation);
  const driver = topDriver(explanation);
  const action = bestAction(optimize);
  const { bank, quota } = bestOfferLines(ranking);

  const cell = (label: string, value: ReactNode) => (
    <div className="min-h-[52px]">
      <p className="text-[10px] uppercase tracking-wide text-slate-500 m-0">
        {label}
      </p>
      <div className="mt-1 text-sm text-slate-100">{value}</div>
    </div>
  );

  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-4">
      <h3 className="text-sm font-medium text-slate-200 m-0 mb-4">
        Resumen ejecutivo
      </h3>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-4">
        {cell(
          "Score",
          <span
            className={`text-[48px] font-bold leading-none tabular-nums ${scoreColor(score)}`}
          >
            {score != null ? Math.round(score) : "N/D"}
          </span>
        )}
        {cell(
          "Decisión",
          <span
            className={`inline-block text-xs font-medium px-2 py-1 rounded ${badge.className}`}
          >
            {badge.text}
          </span>
        )}
        {cell("Top driver", driver)}
        {cell("Mejor acción", action)}
        {cell(
          "Mejor oferta",
          <span>
            {bank}
            {quota ? (
              <>
                <br />
                <span className="text-slate-400">{quota}</span>
              </>
            ) : null}
          </span>
        )}
        {cell(
          "Confianza IA",
          (() => {
            const ex = explanation as Record<string, unknown> | null | undefined;
            const c = ex?.confidence;
            if (c == null) return <span className="text-slate-500">—</span>;
            const n = Number(c);
            return Number.isFinite(n) ? (
              <span className="tabular-nums">{(n * 100 <= 100 && n <= 1 ? n * 100 : n).toFixed(0)}%</span>
            ) : (
              String(c)
            );
          })()
        )}
      </div>
    </div>
  );
}
