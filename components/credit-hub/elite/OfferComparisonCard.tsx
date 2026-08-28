"use client";

import { memo } from "react";
import Link from "next/link";
import type { CreditOffer } from "@/lib/credit-hub/types/offers";
import { lenderDisplayName } from "@/lib/credit-hub/dealer/lender-display";
import { chMoneyExact } from "@/lib/credit-hub/ch-base";

function aprNumber(offer: CreditOffer): number | null {
  if (offer.interest_rate_apr == null) return null;
  return offer.interest_rate_apr < 1 ? offer.interest_rate_apr * 100 : offer.interest_rate_apr;
}

export interface OfferComparisonCardProps {
  offer: CreditOffer;
  currencyPrefix: string;
  isBest?: boolean;
  isAccepted?: boolean;
  canAccept?: boolean;
  accepting?: boolean;
  detailHref?: string;
  onAccept?: () => void;
}

export function SimulatedOfferNotice({ offer }: { offer: CreditOffer }) {
  if (offer.simulated !== true) return null;
  return (
    <div
      data-testid={`offer-simulated-badge-${offer.id}`}
      role="status"
      style={{
        marginTop: 2,
        padding: "7px 9px",
        border: "1px solid var(--ch-warning-line, #F59E0B)",
        borderRadius: 4,
        background: "var(--ch-warning-soft, #FEF3C7)",
        color: "var(--ch-warning-text, #92400E)",
        fontSize: 11,
        fontWeight: 700,
        textAlign: "center",
      }}
    >
      DECISIÓN SIMULADA · no fue otorgada por un banco
    </div>
  );
}

export const OfferComparisonCard = memo(function OfferComparisonCard({
  offer,
  currencyPrefix,
  isBest,
  isAccepted,
  canAccept,
  accepting,
  detailHref,
  onAccept,
}: OfferComparisonCardProps) {
  const name = offer.lender_display_name || lenderDisplayName(offer.lender_code);
  const apr = aprNumber(offer);
  const aprLabel = apr != null ? `${apr.toFixed(1)}%` : "—";
  const terms = (offer.raw as { terms?: Record<string, unknown> })?.terms ?? {};
  const downPct = typeof terms.down_payment_pct === "number" ? terms.down_payment_pct : null;

  const cardClass = ["ch-card ch-card-interactive flex flex-col", isBest ? "ch-card-spotlight" : ""]
    .filter(Boolean)
    .join(" ");

  return (
    <article
      className={cardClass}
      data-testid={`offer-comparison-${offer.id}`}
      style={{
        padding: 16,
        position: "relative",
        borderWidth: isBest ? 2 : 1,
        borderColor: isBest ? "var(--ch-warning, var(--ch-persona))" : undefined,
        background: isAccepted ? "var(--ch-success-soft)" : "var(--ch-surface)",
      }}
    >
      {isBest ? (
        <span
          style={{
            position: "absolute",
            top: -10,
            left: "50%",
            transform: "translateX(-50%)",
            fontSize: 10,
            fontWeight: 700,
            padding: "3px 10px",
            borderRadius: 4,
            background: "var(--ch-warning, #D97706)",
            color: "#fff",
            whiteSpace: "nowrap",
          }}
        >
          ★ MEJOR
        </span>
      ) : null}

      <h3 style={{ margin: "8px 0 10px", fontSize: 15, fontWeight: 700, textAlign: "center" }}>{name}</h3>
      <SimulatedOfferNotice offer={offer} />

      <div style={{ textAlign: "center", marginBottom: 12 }}>
        <div
          className="ch-mono"
          style={{
            fontSize: 28,
            fontWeight: 800,
            color: isBest ? "var(--ch-success-text)" : "var(--ch-text)",
            lineHeight: 1,
          }}
        >
          {aprLabel}
        </div>
        <div className="ch-eyebrow" style={{ marginTop: 4 }}>
          APR
        </div>
        {isBest ? (
          <span className="ch-chip" style={{ marginTop: 6, fontSize: 10, background: "var(--ch-success-soft)", color: "var(--ch-success-text)" }}>
            mejor tasa
          </span>
        ) : null}
      </div>

      <div style={{ borderTop: "1px solid var(--ch-line-subtle)", paddingTop: 10, marginTop: 4 }}>
        {[
          ["Plazo", offer.term_months != null ? `${offer.term_months} meses` : "—"],
          ["Cuota mensual", offer.monthly_payment != null ? chMoneyExact(offer.monthly_payment, currencyPrefix) : "—"],
          ["Monto financiado", offer.amount_approved != null ? chMoneyExact(offer.amount_approved, currencyPrefix) : "—"],
          ["Anticipo", downPct != null ? `${downPct}%` : "—"],
        ].map(([k, v]) => (
          <div key={k} className="ch-field-row">
            <span style={{ color: "var(--ch-text-3)", fontSize: 12 }}>{k}</span>
            <span className="ch-mono font-semibold">{v}</span>
          </div>
        ))}
      </div>

      <div style={{ marginTop: 12, borderTop: "1px solid var(--ch-line-subtle)", paddingTop: 12 }}>
        <div className="ch-eyebrow" style={{ marginBottom: 6 }}>
          Estipulaciones
        </div>
        <div className="flex flex-wrap gap-1">
          {offer.stipulations?.length ? (
            offer.stipulations.slice(0, 4).map((s) => (
              <span key={s} className="ch-chip" style={{ fontSize: 10 }}>
                {s}
              </span>
            ))
          ) : (
            <span className="ch-chip" style={{ fontSize: 10 }}>
              Sin condiciones
            </span>
          )}
        </div>
      </div>

      {canAccept && onAccept ? (
        <button
          type="button"
          className={isBest ? "ch-btn ch-btn-persona ch-btn-sm" : "ch-btn ch-btn-secondary ch-btn-sm"}
          style={{ width: "100%", marginTop: 14, background: isBest ? "var(--ch-warning, var(--ch-persona))" : undefined }}
          disabled={accepting}
          onClick={onAccept}
        >
          {accepting ? "Aceptando…" : "Aceptar oferta"}
        </button>
      ) : detailHref ? (
        <Link
          href={detailHref}
          className={isBest ? "ch-btn ch-btn-persona ch-btn-sm" : "ch-btn ch-btn-secondary ch-btn-sm"}
          style={{ width: "100%", marginTop: 14, textDecoration: "none", textAlign: "center", display: "block" }}
        >
          Aceptar
        </Link>
      ) : isAccepted ? (
        <div style={{ marginTop: 14, fontSize: 12, fontWeight: 600, color: "var(--ch-success-text)", textAlign: "center" }}>
          Oferta elegida
        </div>
      ) : null}
    </article>
  );
});

export function computeOfferSavingsNote(
  offers: CreditOffer[],
  bestId: string | null,
  currencyPrefix: string,
): string | null {
  if (!bestId || offers.length < 2) return null;
  const best = offers.find((o) => o.id === bestId);
  if (!best) return null;
  if (offers.some((offer) => offer.simulated === true)) {
    return "Comparación simulada: estos términos no representan una oferta otorgada por un banco.";
  }
  const bestApr = aprNumber(best);
  const worstApr = Math.max(...offers.map((o) => aprNumber(o) ?? 0));
  const bestName = best.lender_display_name || lenderDisplayName(best.lender_code);
  if (bestApr == null || worstApr <= bestApr) return null;
  const monthlyDiff =
    offers.reduce((max, o) => {
      const p = o.monthly_payment ?? 0;
      return Math.max(max, p);
    }, 0) - (best.monthly_payment ?? 0);
  if (monthlyDiff <= 0) {
    return `${bestName} ofrece la mejor tasa (${bestApr.toFixed(1)}% APR) frente al resto de la subasta.`;
  }
  const term = best.term_months ?? 60;
  return `${bestName} ofrece la mejor tasa (${bestApr.toFixed(1)}% APR) — ahorras ${chMoneyExact(monthlyDiff * term, currencyPrefix)} vs la oferta más alta en el plazo completo.`;
}
