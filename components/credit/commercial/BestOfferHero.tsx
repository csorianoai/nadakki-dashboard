"use client";

function pickNumber(v: unknown): number | null {
  if (v == null) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

export interface BestOfferHeroProps {
  ranking?: unknown;
}

export function BestOfferHero({ ranking }: BestOfferHeroProps) {
  const r = ranking as Record<string, unknown> | null | undefined;
  const bo =
    r?.best_overall && typeof r.best_overall === "object"
      ? (r.best_overall as Record<string, unknown>)
      : null;
  if (!bo) return null;

  const banco = String(
    bo.banco_nombre ?? bo.lender_name ?? bo.bank_name ?? "—"
  );
  const cuota = pickNumber(bo.cuota_total ?? bo.monthly_payment);
  const costo = pickNumber(bo.costo_total ?? bo.total_cost ?? bo.total_amount);
  const rankScore = pickNumber(bo.ranking_score ?? bo.score);
  const pct =
    rankScore != null
      ? rankScore <= 1
        ? Math.min(100, Math.max(0, rankScore * 100))
        : Math.min(100, Math.max(0, rankScore))
      : null;

  return (
    <div className="rounded-xl border-2 border-violet-500/40 bg-violet-500/10 p-5 space-y-3">
      <span className="inline-block text-xs font-medium text-violet-200 bg-violet-500/30 px-2 py-0.5 rounded">
        Mejor opción recomendada
      </span>
      <h3 className="text-xl font-bold text-white m-0">{banco}</h3>
      {cuota != null ? (
        <p className="text-slate-200 m-0">
          RD${" "}
          {cuota.toLocaleString("es-DO", { maximumFractionDigits: 0 })} / mes
        </p>
      ) : null}
      {costo != null ? (
        <p className="text-sm text-slate-400 m-0">
          Costo total: RD${" "}
          {costo.toLocaleString("es-DO", { maximumFractionDigits: 0 })}
        </p>
      ) : null}
      {pct != null ? (
        <div className="h-2 rounded-full bg-black/30 overflow-hidden">
          <div
            className="h-full rounded-full bg-violet-500 transition-all"
            style={{ width: `${pct}%` }}
          />
        </div>
      ) : null}
    </div>
  );
}
