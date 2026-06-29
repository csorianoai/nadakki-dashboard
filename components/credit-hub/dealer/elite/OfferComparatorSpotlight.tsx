"use client";

import Link from "next/link";
import { useMemo } from "react";
import { Car } from "lucide-react";
import type { CreditApplication } from "@/lib/credit-hub/types/creditCore";
import { useApplicationOffers } from "@/lib/credit-hub/hooks/useApplicationOffers";
import { humanizeApplicant } from "@/lib/credit-hub/honesty/humanize-applicant";
import { dealerDetailHref } from "@/lib/credit-hub/dealer/dealerFormat";
import { OfferComparisonCard, computeOfferSavingsNote } from "@/components/credit-hub/elite/OfferComparisonCard";
import { DataTruthBadge } from "@/components/credit-hub/honesty/DataTruthBadge";

const OFFER_STATUSES = new Set(["offered", "counter_offer", "approved", "approved_with_stipulations", "processed"]);

function pickAppForComparator(apps: CreditApplication[]): CreditApplication | null {
  return apps.find((a) => OFFER_STATUSES.has(a.status)) ?? apps.find((a) => a.status === "processing") ?? null;
}

function bestOfferId(offers: { id: string; interest_rate_apr: number | null; monthly_payment: number | null }[]): string | null {
  if (!offers.length) return null;
  const sorted = [...offers].sort((a, b) => {
    const aprA = a.interest_rate_apr ?? 999;
    const aprB = b.interest_rate_apr ?? 999;
    if (aprA !== aprB) return aprA - aprB;
    return (a.monthly_payment ?? 999999) - (b.monthly_payment ?? 999999);
  });
  return sorted[0]?.id ?? null;
}

export function OfferComparatorSpotlight({ applications, currency }: { applications: CreditApplication[]; currency: string }) {
  const target = useMemo(() => pickAppForComparator(applications), [applications]);
  const { offers, isLoading, isError } = useApplicationOffers(target?.application_id);

  if (!target) return null;

  const h = humanizeApplicant(target, currency);
  const currencyPrefix = currency === "DOP" ? "RD$" : "MX$";
  const bestId = bestOfferId(offers);
  const savingsNote = computeOfferSavingsNote(offers, bestId, currencyPrefix);
  const detailHref = dealerDetailHref(target.application_id);
  const truth = offers.length && !isError ? "REAL" : isLoading ? "REAL" : "DEMO";

  return (
    <section data-testid="offer-comparator-spotlight" className="mb-[26px]">
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <span className="ch-eyebrow" style={{ color: "var(--ch-warning-text)" }}>
          FUNCIÓN ESTRELLA
        </span>
        <h2 className="ch-serif" style={{ margin: 0, fontSize: 19 }}>
          Comparador de ofertas
        </h2>
        <DataTruthBadge level={truth} />
      </div>

      <div
        className="ch-card flex flex-wrap items-center justify-between gap-3 mb-3"
        style={{ padding: "12px 14px", background: "var(--ch-surface-2)" }}
      >
        <div className="flex items-center gap-3 min-w-0">
          <Car className="h-5 w-5 shrink-0" style={{ color: "var(--ch-dealer-accent)" }} aria-hidden />
          <div className="min-w-0">
            <div style={{ fontWeight: 600, fontSize: 14 }}>{h.primaryLabel}</div>
            <div style={{ fontSize: 12, color: "var(--ch-text-3)" }}>{h.vehicleLabel}</div>
          </div>
        </div>
        <div className="ch-mono font-bold text-lg">{h.amountLabel}</div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="ch-card animate-pulse" style={{ height: 280 }} />
          ))}
        </div>
      ) : isError || offers.length === 0 ? (
        <div className="ch-card p-4">
          <DataTruthBadge level="DEMO" />
          <p style={{ marginTop: 8, fontSize: 13, color: "var(--ch-text-3)" }}>
            Sin ofertas visibles aún — envía la solicitud a bancos o abre el expediente.
          </p>
          <Link href={detailHref} className="ch-btn ch-btn-secondary ch-btn-sm mt-3 inline-flex">
            Ver expediente
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
          {offers.slice(0, 4).map((offer) => (
            <OfferComparisonCard
              key={offer.id}
              offer={offer}
              currencyPrefix={currencyPrefix}
              isBest={offer.id === bestId}
              isAccepted={offer.status === "accepted"}
              detailHref={detailHref}
            />
          ))}
        </div>
      )}

      {savingsNote ? (
        <p
          style={{
            marginTop: 12,
            padding: "10px 12px",
            borderRadius: 8,
            background: "var(--ch-warning-soft)",
            border: "1px solid var(--ch-warning-line, var(--ch-line))",
            fontSize: 12.5,
            color: "var(--ch-warning-text)",
          }}
        >
          {savingsNote}
        </p>
      ) : null}
    </section>
  );
}
