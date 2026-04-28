"use client";

import { useState } from "react";
import type { BankDecisionRequest, BankDecisionTerms, BankDecisionType, CounterOffer } from "@/lib/credit-hub/types/bankDecision";
import { ForgeButton } from "@/components/credit-hub/primitives/ForgeButton";
import { ForgeInput } from "@/components/credit-hub/primitives/ForgeInput";
import { ForgeSelect } from "@/components/credit-hub/primitives/ForgeSelect";
import { useTranslations } from "@/lib/credit-hub/i18n/useTranslations";

const decisionOptions: Array<[BankDecisionType, string]> = [
  ["APROBADO", "Aprobar como recomendado"],
  ["CONTRA_OFERTA", "Aprobar con ajustes (contra-oferta)"],
  ["RECHAZADO", "Rechazar"],
  ["EN_REVISION", "Solicitar más información"],
];

export function BankDecisionForm({
  defaultTerms,
  counterOffer,
  onSubmit,
  loading,
}: {
  defaultTerms: BankDecisionTerms;
  counterOffer?: CounterOffer;
  onSubmit: (body: BankDecisionRequest) => void;
  loading?: boolean;
}) {
  const t = useTranslations();
  const [decision, setDecision] = useState<BankDecisionType>("APROBADO");
  const [terms, setTerms] = useState<BankDecisionTerms>(defaultTerms);
  const [justification, setJustification] = useState("");

  const useCounterOffer = () => {
    if (counterOffer) {
      setDecision("CONTRA_OFERTA");
      setTerms(counterOffer.counter_offer_terms);
    }
  };

  const updateTerm = (key: keyof BankDecisionTerms, value: string) => {
    setTerms((current) => ({
      ...current,
      [key]: key === "conditions" ? value.split("\n").filter(Boolean) : Number(value || 0),
    }));
  };

  return (
    <div className="space-y-4">
      <ForgeSelect label="Decisión del banco" value={decision} onChange={(event) => setDecision(event.target.value as BankDecisionType)}>
        {decisionOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
      </ForgeSelect>
      {(decision === "APROBADO" || decision === "CONTRA_OFERTA") && (
        <div className="grid gap-3 md:grid-cols-2">
          <ForgeInput label="Monto aprobado" inputMode="decimal" value={String(terms.approved_amount)} onChange={(event) => updateTerm("approved_amount", event.target.value)} />
          <ForgeInput label="Tasa anual (%)" inputMode="decimal" value={String(terms.interest_rate)} onChange={(event) => updateTerm("interest_rate", event.target.value)} />
          <ForgeInput label="Plazo (meses)" inputMode="numeric" value={String(terms.term_months)} onChange={(event) => updateTerm("term_months", event.target.value)} />
          <ForgeInput label="Inicial requerida" inputMode="decimal" value={String(terms.down_payment_required)} onChange={(event) => updateTerm("down_payment_required", event.target.value)} />
          <label className="md:col-span-2">
            <span className="mb-1 block text-sm font-medium text-forge-text">Condiciones</span>
            <textarea
              className="min-h-20 w-full rounded-xl border border-forge-border bg-forge-surface px-3 py-2 text-sm text-forge-text"
              value={terms.conditions.join("\n")}
              onChange={(event) => updateTerm("conditions", event.target.value)}
              placeholder={t.bank.decision_conditions_placeholder}
            />
          </label>
        </div>
      )}
      {counterOffer && <ForgeButton variant="secondary" onClick={useCounterOffer}>Aplicar contra-oferta sugerida</ForgeButton>}
      <label className="block">
        <span className="mb-1 block text-sm font-medium text-forge-text">Justificación obligatoria</span>
        <textarea
          className="min-h-28 w-full rounded-xl border border-forge-border bg-forge-surface px-3 py-2 text-sm text-forge-text"
          value={justification}
          onChange={(event) => setJustification(event.target.value)}
          placeholder={t.bank.decision_justification_placeholder}
        />
      </label>
      <ForgeButton
        size="lg"
        loading={loading}
        disabled={!justification.trim()}
        onClick={() => onSubmit({ decision, justification, analyst_id: "bank-analyst-demo", terms })}
      >
        Confirmar decisión
      </ForgeButton>
    </div>
  );
}
