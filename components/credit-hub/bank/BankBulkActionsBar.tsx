"use client";

import { useState } from "react";
import type { BankBulkRule } from "@/lib/credit-hub/types/bankDecision";
import { useBulkActions } from "@/lib/credit-hub/hooks/useBulkActions";
import { BankBulkActionConfirm } from "./BankBulkActionConfirm";

export function BankBulkActionsBar({ selectedIds, onDone }: { selectedIds: string[]; onDone?: () => void }) {
  const [rule, setRule] = useState<BankBulkRule>("APROBAR_SCORE_GTE_800");
  const [justification, setJustification] = useState("");
  const mutation = useBulkActions();

  const confirm = async () => {
    await mutation.mutateAsync({
      applicationIds: selectedIds,
      rule,
      analystId: "bank-analyst-demo",
      justification,
    });
    setJustification("");
    onDone?.();
  };

  if (selectedIds.length === 0) return null;
  return (
    <div className="sticky bottom-4 z-20">
      <BankBulkActionConfirm
        count={selectedIds.length}
        rule={rule}
        justification={justification}
        isLoading={mutation.isPending}
        onRule={setRule}
        onJustification={setJustification}
        onConfirm={() => void confirm()}
      />
      {mutation.data && (
        <p className="mt-2 rounded-xl bg-forge-surface-elevated p-3 text-sm text-forge-text">
          Resultado: {mutation.data.processed} procesadas, {mutation.data.skipped} omitidas, {mutation.data.errors} errores.
        </p>
      )}
    </div>
  );
}
