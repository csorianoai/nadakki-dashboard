"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { BankApplicationAuthError, BankApplicationHttpError } from "@/lib/bank-application-detail/errors";
import { NOTES_MAX_CHARS } from "@/lib/bank-decision/constants";
import { submitBankDecision } from "@/lib/bank-decision/submit-decision";
import type { BankDecisionType, BankDecideRequestBody, DecideStipulation } from "@/lib/bank-decision/types";
import { requiresAdverseActionPreview, validateDecidePayload } from "@/lib/bank-decision/validate-decide-form";
import { AdverseActionPreview } from "./AdverseActionPreview";
import { CounterOfferCalculator, type CounterTermsState } from "./CounterOfferCalculator";
import { DecisionConfirmDialog } from "./DecisionConfirmDialog";
import { DecisionTypeSelector } from "./DecisionTypeSelector";
import { ReasonCodesSelect } from "./ReasonCodesSelect";
import { StipulationsBuilder } from "./StipulationsBuilder";

export interface DecisionFormModalProps {
  applicationId: string;
  analystActorId: string | null | undefined;
  currency: string;
  grossMonthlyIncome?: number | null;
  baselineAmount?: number | null;
  initialStipulations?: DecideStipulation[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmitted?: () => void | Promise<void>;
}

function emptyCounter(baseline: number | null | undefined): CounterTermsState {
  return {
    amount: baseline != null && baseline > 0 ? baseline : "",
    interest_rate: "",
    term_months: 60,
    down_payment_pct: 10,
    no_match: false,
  };
}

export function DecisionFormModal({
  applicationId,
  analystActorId,
  currency,
  grossMonthlyIncome,
  baselineAmount,
  initialStipulations,
  open,
  onOpenChange,
  onSubmitted,
}: DecisionFormModalProps) {
  const pathname = usePathname();
  const [confirmClose, setConfirmClose] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [busy, setBusy] = useState(false);

  const [decisionType, setDecisionType] = useState<BankDecisionType | null>(null);
  const [reasonCodes, setReasonCodes] = useState<string[]>([]);
  const [stipRows, setStipRows] = useState<DecideStipulation[]>([]);
  const [counter, setCounter] = useState<CounterTermsState>(() => emptyCounter(baselineAmount));
  const [notes, setNotes] = useState("");
  const [adverseAck, setAdverseAck] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | undefined>();

  const markDirty = useCallback(() => setDirty(true), []);

  const resetForm = useCallback(() => {
    setDecisionType(null);
    setReasonCodes([]);
    setStipRows(initialStipulations?.length ? [...initialStipulations] : []);
    setCounter(emptyCounter(baselineAmount));
    setNotes("");
    setAdverseAck(false);
    setFieldErrors({});
    setFormError(undefined);
    setDirty(false);
    setBusy(false);
  }, [baselineAmount, initialStipulations]);

  useEffect(() => {
    if (!open) return;
    resetForm();
  }, [open, applicationId, resetForm]);

  const showAdverse = useMemo(() => {
    if (!decisionType) return false;
    return requiresAdverseActionPreview(
      decisionType,
      decisionType === "COUNTER" && counter.no_match === true,
    );
  }, [decisionType, counter.no_match]);

  const tryDismiss = useCallback(() => {
    if (!dirty) {
      resetForm();
      onOpenChange(false);
      return;
    }
    setConfirmClose(true);
  }, [dirty, onOpenChange, resetForm]);

  const buildPayload = useCallback((): BankDecideRequestBody | null => {
    if (!decisionType || !analystActorId?.trim()) return null;
    const stipulations = stipRows
      .map((s) => ({ ...s, description: s.description.trim() }))
      .filter((s) => s.description.length > 0);
    const payload: BankDecideRequestBody = {
      decision_type: decisionType,
      reason_codes: reasonCodes,
      stipulations,
      notes: notes.trim(),
    };
    if (decisionType === "COUNTER") {
      payload.counter_terms = {
        amount: typeof counter.amount === "number" ? counter.amount : 0,
        interest_rate: typeof counter.interest_rate === "number" ? counter.interest_rate : 0,
        term_months: typeof counter.term_months === "number" ? counter.term_months : 0,
        down_payment_pct: typeof counter.down_payment_pct === "number" ? counter.down_payment_pct : 0,
        no_match: counter.no_match,
      };
    }
    const needsAdv = requiresAdverseActionPreview(decisionType, counter.no_match === true);
    payload.adverse_action = needsAdv ? adverseAck === true : false;
    return payload;
  }, [adverseAck, analystActorId, counter, decisionType, notes, reasonCodes, stipRows]);

  const handleSubmit = async () => {
    const payload = buildPayload();
    if (!payload) {
      toast.error("Formulario incompleto o sin actor de banco.");
      return;
    }
    const v = validateDecidePayload(payload);
    if (v.formError) {
      setFieldErrors(v.fieldErrors);
      setFormError(v.formError);
      return;
    }
    setFieldErrors({});
    setFormError(undefined);
    if (!analystActorId?.trim()) {
      toast.error("Falta analyst_id en la solicitud reclamada (X-Actor-ID).");
      return;
    }
    setBusy(true);
    try {
      const res = await submitBankDecision(applicationId, payload, analystActorId.trim());
      toast.success(`Decisión registrada: ${res.decision_type}`);
      if (res.adverse_action_letter_url) {
        toast.message("Carta de acción adversa disponible.", { duration: 5000 });
      }
      resetForm();
      onOpenChange(false);
      await onSubmitted?.();
    } catch (e) {
      if (e instanceof BankApplicationAuthError) {
        window.location.href = `/login?next=${encodeURIComponent(pathname)}`;
        return;
      }
      if (e instanceof BankApplicationHttpError) {
        if (e.status === 401) {
          window.location.href = `/login?next=${encodeURIComponent(pathname)}`;
          return;
        }
        if (e.status === 409) {
          toast.error("Conflicto: la solicitud cambió. Recarga e intenta de nuevo.");
        } else if (e.status >= 500) {
          toast.error("Error del servidor al registrar la decisión.");
        } else {
          toast.error(e.message || "No se pudo registrar la decisión.");
        }
        return;
      }
      toast.error("No se pudo registrar la decisión.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <Dialog
        open={open}
        onOpenChange={(next) => {
          if (next) {
            onOpenChange(true);
            return;
          }
          tryDismiss();
        }}
      >
        <DialogContent
          className="max-h-[90vh] max-w-3xl overflow-y-auto border-forgeGray-200 bg-white"
          onEscapeKeyDown={(e) => {
            e.preventDefault();
            tryDismiss();
          }}
          onInteractOutside={(e) => {
            e.preventDefault();
            tryDismiss();
          }}
        >
          <DialogHeader>
            <DialogTitle className="text-forgeGray-900">Decisión de crédito</DialogTitle>
          </DialogHeader>

          <div className="space-y-4" aria-busy={busy}>
            {!analystActorId?.trim() ? (
              <p className="rounded-md border border-rose-200 bg-rose-50 p-3 text-forge-sm text-rose-900" role="alert">
                No hay <span className="font-forgeMono">analyst_id</span> en el claim. Reclama de nuevo o verifica el
                backend (EP-10a/EP-13).
              </p>
            ) : null}

            <div aria-live="assertive" className="min-h-0">
              {formError ? (
                <p className="rounded-md border border-rose-200 bg-rose-50 p-2 text-forge-sm text-rose-900" role="alert">
                  {formError}
                </p>
              ) : null}
            </div>

            <DecisionTypeSelector
              value={decisionType}
              disabled={busy}
              onChange={(t) => {
                markDirty();
                setDecisionType(t);
                setReasonCodes([]);
                setFieldErrors({});
                setFormError(undefined);
              }}
            />

            <ReasonCodesSelect
              decisionType={decisionType}
              value={reasonCodes}
              disabled={busy}
              onChange={(c) => {
                markDirty();
                setReasonCodes(c);
              }}
            />

            {fieldErrors.reason_codes ? (
              <p className="text-forge-xs text-rose-700" id="err-reason_codes">
                {fieldErrors.reason_codes}
              </p>
            ) : null}

            <StipulationsBuilder
              value={stipRows}
              disabled={busy}
              onChange={(r) => {
                markDirty();
                setStipRows(r);
              }}
            />

            {decisionType === "COUNTER" ? (
              <CounterOfferCalculator
                currency={currency}
                grossMonthlyIncome={grossMonthlyIncome}
                value={counter}
                disabled={busy}
                onChange={(c) => {
                  markDirty();
                  setCounter(c);
                }}
              />
            ) : null}
            {decisionType === "COUNTER" ? (
              <div className="space-y-1 text-forge-xs text-rose-700">
                {fieldErrors.counter_amount ? <p>{fieldErrors.counter_amount}</p> : null}
                {fieldErrors.counter_rate ? <p>{fieldErrors.counter_rate}</p> : null}
                {fieldErrors.counter_term ? <p>{fieldErrors.counter_term}</p> : null}
                {fieldErrors.counter_down ? <p>{fieldErrors.counter_down}</p> : null}
              </div>
            ) : null}

            <AdverseActionPreview
              visible={showAdverse}
              acknowledged={adverseAck}
              disabled={busy}
              onAckChange={(v) => {
                markDirty();
                setAdverseAck(v);
              }}
            />
            {fieldErrors.adverse_action ? (
              <p className="text-forge-xs text-rose-700">{fieldErrors.adverse_action}</p>
            ) : null}

            <label className="block text-forge-sm font-medium text-forgeGray-900">
              Notas internas
              <textarea
                className="mt-2 min-h-[88px] w-full rounded-lg border border-forgeGray-300 px-3 py-2 text-forge-sm text-forgeGray-900"
                disabled={busy}
                maxLength={NOTES_MAX_CHARS}
                placeholder="Opcional — visibles solo en auditoría bancaria"
                value={notes}
                aria-invalid={!!fieldErrors.notes}
                aria-describedby={fieldErrors.notes ? "notes-err" : undefined}
                onChange={(e) => {
                  markDirty();
                  setNotes(e.target.value);
                }}
              />
              <span className="mt-1 block text-forge-xs text-forgeGray-500">
                {notes.length}/{NOTES_MAX_CHARS}
              </span>
            </label>
            {fieldErrors.notes ? (
              <p className="text-forge-xs text-rose-700" id="notes-err">
                {fieldErrors.notes}
              </p>
            ) : null}
          </div>

          <DialogFooter className="gap-2 sm:justify-between">
            <button
              type="button"
              className="rounded-lg border border-forgeGray-300 px-4 py-2 text-forge-sm text-forgeGray-900 hover:bg-forgeGray-50"
              disabled={busy}
              onClick={() => tryDismiss()}
            >
              Cancelar
            </button>
            <button
              type="button"
              className="rounded-lg bg-forgeBrand-600 px-4 py-2 text-forge-sm font-medium text-white hover:bg-forgeBrand-700 disabled:opacity-50"
              disabled={busy || !analystActorId?.trim()}
              onClick={() => void handleSubmit()}
            >
              {busy ? "Enviando…" : "Registrar decisión"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <DecisionConfirmDialog
        open={confirmClose}
        onOpenChange={setConfirmClose}
        onConfirmLeave={() => {
          resetForm();
          onOpenChange(false);
        }}
      />
    </>
  );
}
