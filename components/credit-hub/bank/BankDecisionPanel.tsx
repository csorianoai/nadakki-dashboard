"use client";

import { forgeToast } from "@/components/credit-hub/system/ForgeToaster";
import { ForgeCard } from "@/components/credit-hub/primitives/ForgeCard";
import { useBankCounterOffer, useBankDecision } from "@/lib/credit-hub/hooks/useBankDecision";
import type { BankDecisionTerms, BankReviewApplication } from "@/lib/credit-hub/types/bankDecision";
import { BankCounterOfferModal } from "./BankCounterOfferModal";
import { BankDecisionForm } from "./BankDecisionForm";
import { useTranslations } from "@/lib/credit-hub/i18n/useTranslations";

function defaultTerms(application?: BankReviewApplication): BankDecisionTerms {
  const analysis = application?.application_payload.analysis;
  const metrics = analysis?.metrics;
  return {
    approved_amount: Number(analysis?.financed_amount ?? 0),
    interest_rate: Number(metrics?.annual_rate ?? 18),
    term_months: Number(metrics?.term_months ?? 36),
    down_payment_required: Number(metrics?.down_payment ?? 0),
    conditions: ["Validación documental final"],
  };
}

export function BankDecisionPanel({ application }: { application: BankReviewApplication }) {
  const t = useTranslations();
  const decisionMutation = useBankDecision(application.application_id);
  const counterOfferQuery = useBankCounterOffer(application.application_id);
  const existing = application.application_payload.bank_decision;

  return (
    <ForgeCard className="space-y-5">
      <div>
        <p className="text-sm uppercase tracking-[0.18em] text-forge-primary">Decisión del banco</p>
        <h2 className="mt-1 font-display text-2xl font-bold text-forge-text">Registro final auditable</h2>
        {existing && <p className="mt-2 text-sm text-forge-success">Decisión actual: {existing.decision} por {existing.decided_by}</p>}
      </div>
      <BankCounterOfferModal offer={counterOfferQuery.data} onUse={() => undefined} />
      <BankDecisionForm
        defaultTerms={defaultTerms(application)}
        counterOffer={counterOfferQuery.data}
        loading={decisionMutation.isPending}
        onSubmit={async (body) => {
          await decisionMutation.mutateAsync(body);
          forgeToast.success(t.toasts.decision_confirmed);
        }}
      />
    </ForgeCard>
  );
}
