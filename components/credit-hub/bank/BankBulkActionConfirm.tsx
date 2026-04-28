"use client";

import type { BankBulkRule } from "@/lib/credit-hub/types/bankDecision";
import { ForgeButton } from "@/components/credit-hub/primitives/ForgeButton";
import { ForgeCard } from "@/components/credit-hub/primitives/ForgeCard";
import { ForgeSelect } from "@/components/credit-hub/primitives/ForgeSelect";

const rules: Array<[BankBulkRule, string]> = [
  ["APROBAR_SCORE_GTE_800", "Aprobar todas con score >= 800"],
  ["RECHAZAR_SCORE_LT_580", "Rechazar todas con score < 580"],
  ["REVISAR_BORDERLINE", "Marcar borderline para revisión"],
  ["SOLICITAR_DOCUMENTOS", "Solicitar documentos"],
];

export function BankBulkActionConfirm({
  count,
  rule,
  justification,
  isLoading,
  onRule,
  onJustification,
  onConfirm,
}: {
  count: number;
  rule: BankBulkRule;
  justification: string;
  isLoading?: boolean;
  onRule: (rule: BankBulkRule) => void;
  onJustification: (value: string) => void;
  onConfirm: () => void;
}) {
  return (
    <ForgeCard className="border-forge-primary/30 bg-forge-primary/5">
      <div className="grid gap-3 md:grid-cols-[1fr_1fr_auto] md:items-end">
        <ForgeSelect label={`Acción en lote (${count} seleccionadas)`} value={rule} onChange={(event) => onRule(event.target.value as BankBulkRule)}>
          {rules.map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </ForgeSelect>
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-forge-text">Justificación obligatoria</span>
          <textarea
            value={justification}
            onChange={(event) => onJustification(event.target.value)}
            className="min-h-[44px] w-full rounded-xl border border-forge-border bg-forge-surface px-3 py-2 text-sm text-forge-text"
            placeholder="Describe la regla aplicada..."
          />
        </label>
        <ForgeButton onClick={onConfirm} loading={isLoading} disabled={!justification.trim() || count === 0}>
          Confirmar lote
        </ForgeButton>
      </div>
    </ForgeCard>
  );
}
