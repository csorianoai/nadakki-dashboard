"use client";

import { useState } from "react";
import type { BankBulkRule } from "@/lib/credit-hub/types/bankDecision";
import { useBulkActions } from "@/lib/credit-hub/hooks/useBulkActions";
import { BankBulkActionConfirm } from "./BankBulkActionConfirm";
import { useTranslations } from "@/lib/credit-hub/i18n/useTranslations";
import { tokenStorage } from "@/lib/auth/token-storage";
import { decodeJWT } from "@/lib/auth/jwt-decode";

export function BankBulkActionsBar({ selectedIds, onDone }: { selectedIds: string[]; onDone?: () => void }) {
  const t = useTranslations();
  const [rule, setRule] = useState<BankBulkRule>("APROBAR_SCORE_GTE_800");
  const [justification, setJustification] = useState("");
  const mutation = useBulkActions();

  const confirm = async () => {
    const token = tokenStorage.getAccessToken();
    const analystId = token ? (decodeJWT(token)?.sub ?? "unknown") : "unknown";
    await mutation.mutateAsync({
      applicationIds: selectedIds,
      rule,
      analystId,
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
          {t.bank.bulk_result(mutation.data.processed, mutation.data.skipped, mutation.data.errors)}
        </p>
      )}
    </div>
  );
}
