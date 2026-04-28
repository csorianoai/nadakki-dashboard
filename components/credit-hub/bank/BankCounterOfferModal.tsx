"use client";

import type { CounterOffer } from "@/lib/credit-hub/types/bankDecision";
import { ForgeButton } from "@/components/credit-hub/primitives/ForgeButton";
import { ForgeCard } from "@/components/credit-hub/primitives/ForgeCard";

function dop(value: number) {
  return new Intl.NumberFormat("es-DO", { style: "currency", currency: "DOP", maximumFractionDigits: 0 }).format(value || 0);
}

export function BankCounterOfferModal({ offer, onUse }: { offer?: CounterOffer; onUse: () => void }) {
  if (!offer) return null;
  return (
    <ForgeCard className="border-forge-info/30 bg-forge-info/5">
      <h3 className="font-semibold text-forge-text">Contra-oferta sugerida</h3>
      <p className="mt-1 text-sm text-forge-text-muted">{offer.explanation}</p>
      <div className="mt-4 grid gap-3 md:grid-cols-4">
        <div><p className="text-xs text-forge-text-muted">Monto</p><p className="font-semibold text-forge-text">{dop(offer.counter_offer_terms.approved_amount)}</p></div>
        <div><p className="text-xs text-forge-text-muted">Tasa</p><p className="font-semibold text-forge-text">{offer.counter_offer_terms.interest_rate}%</p></div>
        <div><p className="text-xs text-forge-text-muted">Plazo</p><p className="font-semibold text-forge-text">{offer.counter_offer_terms.term_months} meses</p></div>
        <div><p className="text-xs text-forge-text-muted">Ajuste</p><p className="font-semibold text-forge-text">{offer.rate_adjustment_bps} bps</p></div>
      </div>
      <ForgeButton className="mt-4" variant="secondary" onClick={onUse}>Usar contra-oferta</ForgeButton>
    </ForgeCard>
  );
}
