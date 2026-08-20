"use client";

import { ForgeCard } from "@/components/credit-hub/primitives/ForgeCard";
import { toast } from "@/components/forge";
import { useBankCounterOffer, useBankDecision } from "@/lib/credit-hub/hooks/useBankDecision";
import { useTenantConfig } from "@/lib/credit-hub/hooks/useTenantConfig";
import type { BankDecisionRequest, BankDecisionTerms, BankReviewApplication } from "@/lib/credit-hub/types/bankDecision";
import { BankCounterOfferModal } from "./BankCounterOfferModal";
import { BankDecisionForm } from "./BankDecisionForm";
import { useTranslations } from "@/lib/credit-hub/i18n/useTranslations";
import { forgeBankDecisionToasts, forgeToastLangFromLocale, formatToastApplicationId } from "@/utils/forge-toast-copy";
import { useAuth } from "@/hooks/useAuth";

function defaultTerms(application?: BankReviewApplication): BankDecisionTerms {
  const analysis = application?.application_payload.analysis;
  const metrics = analysis?.metrics;
  // F4: Prefer financed_amount; avoid ?? 0 fallback when data is truly absent
  const approvedAmount = analysis?.financed_amount;
  return {
    approved_amount: approvedAmount != null ? Number(approvedAmount) : 0,
    interest_rate: Number(metrics?.annual_rate ?? 18),
    term_months: Number(metrics?.term_months ?? 36),
    down_payment_required: Number(metrics?.down_payment ?? 0),
    conditions: ["Validación documental final"],
  };
}

export function BankDecisionPanel({ application }: { application: BankReviewApplication }) {
  const t = useTranslations();
  const { user } = useAuth();
  const { tenantConfig } = useTenantConfig();
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
        analystId={user?.id}
        loading={decisionMutation.isPending}
        onSubmit={async (body: BankDecisionRequest) => {
          const lang = forgeToastLangFromLocale(tenantConfig.locale);
          const copy = forgeBankDecisionToasts(lang);
          const displayId = formatToastApplicationId(application.application_id);
          try {
            await decisionMutation.mutateAsync(body);
            if (body.decision === "APROBADO") {
              toast.success(copy.applicationApproved(displayId), { duration: 4000 });
            } else if (body.decision === "RECHAZADO") {
              toast.success(copy.applicationRejected(displayId), { duration: 4000 });
            } else {
              toast.success(t.toasts.decision_confirmed, { duration: 4000 });
            }
          } catch (err) {
            const detail = err instanceof Error ? err.message : undefined;
            toast.error(copy.decisionSaveError(detail), { duration: 6000 });
          }
        }}
      />
    </ForgeCard>
  );
}
