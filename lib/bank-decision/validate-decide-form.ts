import { NOTES_MAX_CHARS } from "@/lib/bank-decision/constants";
import { validateReasonCodes } from "@/lib/bank-decision/reason-codes";
import type {
  BankDecisionType,
  BankDecideRequestBody,
  DecideFormValidationIssues,
} from "@/lib/bank-decision/types";

export function requiresAdverseActionPreview(
  decisionType: BankDecisionType,
  noMatch: boolean,
): boolean {
  if (decisionType === "REJECT") return true;
  if (decisionType === "COUNTER" && noMatch) return true;
  return false;
}

export function validateDecidePayload(body: BankDecideRequestBody): DecideFormValidationIssues {
  const fieldErrors: Record<string, string> = {};
  if (!body.decision_type) fieldErrors.decision_type = "Selecciona un tipo de decisión.";
  const notes = body.notes ?? "";
  if (notes.length > NOTES_MAX_CHARS) {
    fieldErrors.notes = `Máximo ${NOTES_MAX_CHARS} caracteres.`;
  }
  if (!validateReasonCodes(body.decision_type, body.reason_codes)) {
    fieldErrors.reason_codes = "Selecciona al menos un código de razón válido para el tipo.";
  }
  if (body.decision_type === "COUNTER") {
    const c = body.counter_terms;
    if (!c || typeof c.amount !== "number" || c.amount <= 0) {
      fieldErrors.counter_amount = "Monto contraoferta debe ser mayor a cero.";
    }
    if (!c || typeof c.interest_rate !== "number" || c.interest_rate < 0 || c.interest_rate > 100) {
      fieldErrors.counter_rate = "Tasa anual debe estar entre 0 y 100.";
    }
    if (!c || typeof c.term_months !== "number" || !Number.isInteger(c.term_months) || c.term_months <= 0) {
      fieldErrors.counter_term = "Plazo debe ser entero mayor a cero.";
    }
    if (
      c &&
      typeof c.down_payment_pct === "number" &&
      (c.down_payment_pct < 0 || c.down_payment_pct > 100)
    ) {
      fieldErrors.counter_down = "Anticipo % debe estar entre 0 y 100.";
    }
  }
  if (requiresAdverseActionPreview(body.decision_type, body.counter_terms?.no_match === true)) {
    if (body.adverse_action !== true) fieldErrors.adverse_action = "Debes confirmar acción adversa/regulatorio.";
  }
  return {
    fieldErrors,
    formError:
      Object.keys(fieldErrors).length > 0
        ? "Revisa los campos marcados antes de enviar."
        : undefined,
  };
}
