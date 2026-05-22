"use client";

import { useParams, useRouter } from "next/navigation";
import { useOffers } from "@/hooks/useOffers";
import { useAuthContext } from "@/hooks/useAuthContext";
import type { Offer } from "@/types/credit-offers";
import Link from "next/link";

function formatCurrency(value: number | null | undefined): string {
  if (value == null) return "—";
  return value.toLocaleString("es-DO", {
    style: "currency",
    currency: "DOP",
    minimumFractionDigits: 2,
  });
}

function AcceptedOfferSummary({ offer }: { offer: Offer }) {
  return (
    <div
      className="rounded-lg border bg-card p-6 space-y-4"
      data-testid="accepted-offer-summary"
    >
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
          <svg
            className="h-5 w-5 text-green-600"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M4.5 12.75l6 6 9-13.5"
            />
          </svg>
        </div>
        <div>
          <h2 className="text-lg font-semibold">Oferta aceptada</h2>
          <p className="text-sm text-muted-foreground">
            Estado: OFFER_SELECTED
          </p>
        </div>
      </div>

      <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
        <div>
          <dt className="text-muted-foreground">Banco / Lender</dt>
          <dd className="font-medium" data-testid="confirmation-lender">
            {offer.lender_code}
          </dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Monto aprobado</dt>
          <dd className="font-medium" data-testid="confirmation-amount">
            {formatCurrency(offer.amount_approved)}
          </dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Tasa anual (APR)</dt>
          <dd className="font-medium" data-testid="confirmation-rate">
            {offer.interest_rate_apr != null
              ? `${offer.interest_rate_apr.toFixed(2)}%`
              : "—"}
          </dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Plazo</dt>
          <dd className="font-medium" data-testid="confirmation-term">
            {offer.term_months != null ? `${offer.term_months} meses` : "—"}
          </dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Cuota mensual</dt>
          <dd className="font-medium" data-testid="confirmation-payment">
            {formatCurrency(offer.monthly_payment)}
          </dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Estado de oferta</dt>
          <dd className="font-medium">{offer.status}</dd>
        </div>
      </dl>
    </div>
  );
}

export default function ConfirmationPage() {
  const router = useRouter();
  const routeParams = useParams();
  const applicationId =
    typeof routeParams?.id === "string" ? routeParams.id : "";
  const { tenantId } = useAuthContext();

  const { data, isLoading, isError, error } = useOffers({
    applicationId,
    tenantId,
    enabled: Boolean(applicationId && tenantId),
  });

  const offers = data?.offers ?? [];
  // The accepted offer is the most recently selected — look for "approved" status first
  const acceptedOffer =
    offers.find((o) => o.status === "approved") ?? offers[0] ?? null;

  if (!applicationId) {
    return (
      <div className="container py-8" data-testid="confirmation-error">
        <p className="text-muted-foreground">
          Falta el identificador de la aplicación.
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="container py-8" data-testid="confirmation-loading">
        <p className="text-muted-foreground">Cargando confirmación...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="container py-8" data-testid="confirmation-error">
        <h2 className="text-lg font-semibold">Error</h2>
        <p className="text-sm text-muted-foreground">
          {error instanceof Error ? error.message : "Error desconocido"}
        </p>
      </div>
    );
  }

  return (
    <div
      className="container max-w-2xl py-8 space-y-6"
      data-testid="confirmation-page"
    >
      <header>
        <h1 className="text-2xl font-bold">Confirmación de selección</h1>
        <p className="text-sm text-muted-foreground">
          Aplicación {applicationId}
        </p>
      </header>

      {acceptedOffer ? (
        <AcceptedOfferSummary offer={acceptedOffer} />
      ) : (
        <div className="rounded-lg border bg-card p-6">
          <p className="text-muted-foreground">
            No se encontró una oferta aceptada para esta solicitud.
          </p>
        </div>
      )}

      <div className="flex gap-3">
        <Link
          href={`/credit/dealer/${applicationId}`}
          className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Ver detalle de solicitud
        </Link>
        <button
          type="button"
          className="inline-flex items-center justify-center rounded-md border px-4 py-2 text-sm font-medium hover:bg-accent"
          onClick={() => router.push("/credit/dealer")}
        >
          Volver al listado
        </button>
      </div>
    </div>
  );
}
