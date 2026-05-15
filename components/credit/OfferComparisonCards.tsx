"use client";

import type { Offer } from "@/types/credit-offers";

export interface OfferComparisonCardsProps {
  offers: Offer[];
  onSelectOffer?: (offerId: string) => void;
  isLoading?: boolean;
  error?: Error | null;
  /** Invoked when the user taps Retry in the error state. */
  onRetry?: () => void;
}

function formatCurrencyUSD(value: number | null | undefined): string {
  if (value == null || Number.isNaN(Number(value))) {
    return "—";
  }
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(Number(value));
}

function formatAprPercent(value: number | null | undefined): string {
  if (value == null || Number.isNaN(Number(value))) {
    return "—";
  }
  return `${Number(value).toFixed(2)}%`;
}

function formatTermMonths(months: number | null | undefined): string {
  if (months == null || Number.isNaN(Number(months))) {
    return "—";
  }
  return `${months} mo`;
}

function normalizeStatusKey(status: string): string {
  return status.trim().toLowerCase().replace(/\s+/g, "_");
}

/** Maps canonical / API statuses to badge palette classes (Tailwind). */
function statusBadgeClasses(status: string): string {
  const key = normalizeStatusKey(status);
  switch (key) {
    case "approved":
    case "approve":
      return "bg-emerald-600/90 text-white";
    case "declined":
    case "decline":
    case "rejected":
      return "bg-red-600/90 text-white";
    case "counter_offer":
    case "counteroffer":
    case "review":
    case "conditioned":
      return "bg-sky-600/90 text-white";
    case "pending":
    default:
      return "bg-amber-600/90 text-white";
  }
}

function lenderLabel(code: string): string {
  if (!code.trim()) return "—";
  return code
    .split(/[_\s]+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

function LoadingSkeleton() {
  const placeholders = Array.from({ length: 6 }, (_, i) => i);
  return (
    <div
      aria-busy="true"
      aria-live="polite"
      className="offer-comparison-cards-skeleton grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
      data-testid="offer-comparison-loading"
    >
      {placeholders.map((key) => (
        <div
          key={key}
          className="animate-pulse rounded-xl border border-white/10 bg-white/5 p-4 shadow-inner"
        >
          <div className="mb-3 h-4 w-1/3 rounded bg-white/20" />
          <div className="mb-4 h-6 w-1/4 rounded bg-white/15" />
          <div className="space-y-2">
            <div className="h-3 w-full rounded bg-white/10" />
            <div className="h-3 w-5/6 rounded bg-white/10" />
            <div className="h-3 w-2/3 rounded bg-white/10" />
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyState() {
  return (
    <div
      className="offer-comparison-cards-empty rounded-xl border border-dashed border-white/20 bg-white/5 px-6 py-12 text-center text-white/80"
      data-testid="offer-comparison-empty"
    >
      <p className="text-lg font-medium text-white">No offers to compare</p>
      <p className="mt-2 text-sm text-white/60">
        Offers from lenders will appear here.
      </p>
    </div>
  );
}

function ErrorState({
  error,
  onRetry,
}: {
  error: Error;
  onRetry?: () => void;
}) {
  return (
    <div
      className="offer-comparison-cards-error rounded-xl border border-red-500/40 bg-red-950/40 px-6 py-8 text-red-50"
      data-testid="offer-comparison-error"
      role="alert"
    >
      <p className="font-semibold">Something went wrong</p>
      <p className="mt-2 text-sm opacity-90">{error.message}</p>
      {onRetry ? (
        <button
          type="button"
          className="mt-4 rounded-lg bg-white px-4 py-2 text-sm font-medium text-red-900 hover:bg-red-50"
          onClick={onRetry}
        >
          Retry
        </button>
      ) : null}
    </div>
  );
}

export function OfferComparisonCards({
  offers,
  onSelectOffer,
  isLoading,
  error,
  onRetry,
}: OfferComparisonCardsProps) {
  if (isLoading) {
    return (
      <div data-testid="offer-comparison-cards">
        <LoadingSkeleton />
      </div>
    );
  }

  if (error) {
    return (
      <div data-testid="offer-comparison-cards">
        <ErrorState error={error} onRetry={onRetry} />
      </div>
    );
  }

  if (!offers.length) {
    return (
      <div data-testid="offer-comparison-cards">
        <EmptyState />
      </div>
    );
  }

  return (
    <div data-testid="offer-comparison-cards">
      <div
        className="offer-comparison-cards-grid grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
        data-testid="offer-comparison-grid"
      >
        {offers.map((offer) => {
          const badgeTone = statusBadgeClasses(offer.status);
          const selectable = typeof onSelectOffer === "function";
          return (
            <article
              key={offer.id}
              role={selectable ? "button" : undefined}
              tabIndex={selectable ? 0 : undefined}
              data-offer-id={offer.id}
              data-testid="offer-card"
              className={`offer-card rounded-xl border border-white/10 bg-white/5 p-4 text-left text-white shadow-lg backdrop-blur-sm transition hover:border-white/25 ${
                selectable
                  ? "cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-400"
                  : ""
              }`}
              onClick={() => selectable && onSelectOffer(offer.id)}
              onKeyDown={(e) => {
                if (!selectable) return;
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onSelectOffer(offer.id);
                }
              }}
            >
              <div className="flex items-start justify-between gap-2">
                <h3 className="text-lg font-semibold tracking-tight">
                  {lenderLabel(offer.lender_code)}
                </h3>
                <span
                  data-testid="offer-status-badge"
                  data-status={normalizeStatusKey(offer.status)}
                  className={`inline-flex shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${badgeTone}`}
                >
                  {normalizeStatusKey(offer.status).replace(/_/g, " ")}
                </span>
              </div>
              <dl className="mt-4 space-y-2 text-sm">
                <div className="flex justify-between gap-4">
                  <dt className="text-white/60">Amount</dt>
                  <dd
                    className="font-medium tabular-nums"
                    data-testid="offer-amount"
                  >
                    {formatCurrencyUSD(offer.amount_approved)}
                  </dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-white/60">APR</dt>
                  <dd className="font-medium tabular-nums">
                    {formatAprPercent(offer.interest_rate_apr)}
                  </dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-white/60">Term</dt>
                  <dd className="font-medium tabular-nums">
                    {formatTermMonths(offer.term_months)}
                  </dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-white/60">Monthly</dt>
                  <dd
                    className="font-medium tabular-nums"
                    data-testid="offer-monthly"
                  >
                    {formatCurrencyUSD(offer.monthly_payment)}
                  </dd>
                </div>
              </dl>
              {selectable ? (
                <button
                  type="button"
                  data-testid={`select-offer-${offer.id}`}
                  className="mt-4 w-full rounded-lg bg-white/15 px-3 py-2 text-sm font-medium text-white hover:bg-white/25"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectOffer(offer.id);
                  }}
                >
                  Select offer
                </button>
              ) : null}
            </article>
          );
        })}
      </div>
    </div>
  );
}
