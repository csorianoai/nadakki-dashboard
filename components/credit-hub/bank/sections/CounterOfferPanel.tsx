"use client";

import { useQuery } from "@tanstack/react-query";
import { CHApiError } from "@/lib/credit-hub/api/client";
import { getCounterOffer } from "@/lib/credit-hub/api/bankClient";
import { chMoneyExact } from "@/lib/credit-hub/ch-base";
import { useTenant } from "@/lib/credit-hub/hooks/useTenant";

export function CounterOfferPanel({ applicationId }: { applicationId: string }) {
  const { apiTenantId } = useTenant();

  const q = useQuery({
    queryKey: ["counter-offer-panel", apiTenantId, applicationId],
    queryFn: () => getCounterOffer({ tenantId: apiTenantId!, applicationId }),
    enabled: !!apiTenantId,
    retry: false,
  });

  if (q.isLoading) {
    return (
      <div className="ch-card p-4 text-sm text-forgeGray-500" data-testid="counter-offer-loading">
        Cargando contrapropuesta…
      </div>
    );
  }

  if (q.error instanceof CHApiError) {
    if (q.error.status === 404 || q.error.status === 501) return null;
    return (
      <div className="ch-card p-4 text-sm" style={{ color: "var(--ch-danger-text)" }} data-testid="counter-offer-error">
        No se pudo cargar la contrapropuesta.
      </div>
    );
  }

  const co = q.data;
  if (!co?.counter_offer_terms) return null;

  const orig = co.original_terms;
  const counter = co.counter_offer_terms;

  return (
    <div className="ch-card p-4" data-testid="counter-offer-panel">
      <h3 className="ch-serif" style={{ margin: "0 0 8px", fontSize: 16 }}>
        Contrapropuesta sugerida
      </h3>
      <p style={{ fontSize: 12.5, color: "var(--ch-text-3)", marginBottom: 12 }}>{co.explanation}</p>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="rounded-lg border border-forgeGray-100 p-3">
          <div className="ch-eyebrow">Términos solicitados</div>
          <ul className="mt-2 space-y-1 text-sm">
            <li>Monto: {chMoneyExact(orig.approved_amount)}</li>
            <li>Tasa: {orig.interest_rate}%</li>
            <li>Plazo: {orig.term_months} meses</li>
          </ul>
        </div>
        <div className="rounded-lg border border-forgeGray-100 p-3" style={{ background: "var(--ch-info-soft)" }}>
          <div className="ch-eyebrow">Contrapropuesta</div>
          <ul className="mt-2 space-y-1 text-sm">
            <li>Monto: {chMoneyExact(counter.approved_amount)}</li>
            <li>Tasa: {counter.interest_rate}%</li>
            <li>Plazo: {counter.term_months} meses</li>
            <li>Ajuste tasa: {co.rate_adjustment_bps} bps</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
