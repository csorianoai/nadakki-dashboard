import type { BankReviewApplication } from "../types/bankDecision";
import type { ExpedienteFullResponse } from "../types/expediente";
import type { CreditAnalysisResult } from "../types/creditAnalysis";
import type { DeclaracionVehiculoPayload } from "../dealer/vehicle-declaration";
import { extractPilotLabels, type PilotLabels } from "../labels/pilot-labels";

function asAnalysis(summary: Record<string, unknown>, score?: number): CreditAnalysisResult | undefined {
  const merged = { ...summary };
  if (score != null && merged.score == null) merged.score = score;
  if (merged.score == null && Object.keys(merged).length === 0) return undefined;
  return merged as unknown as CreditAnalysisResult;
}

/** 
 * Extract financial data from expediente summary.
 * 
 * Backend does NOT return `financial` at root level, it's in credit_history.summary.financial
 * This function handles the fallback chain:
 * 1. summary.financial
 * 2. summary.financing
 * 3. summary.loan
 * 4. Individual fields at summary root (requested_amount, down_payment, etc.)
 * 
 * Exported for testing.
 */
export function extractFinancial(summary: Record<string, unknown>): Record<string, unknown> {
  const fin = summary.financial ?? summary.financing ?? summary.loan;
  if (fin && typeof fin === "object") return fin as Record<string, unknown>;
  const out: Record<string, unknown> = {};
  for (const key of ["requested_amount", "down_payment", "term_months", "requested_rate", "ltv", "dti"] as const) {
    if (summary[key] != null) out[key] = summary[key];
  }
  return out;
}

/** Map expediente/full aggregate into the shape BankDetailLayout expects. */
export function expedienteToBankReviewApplication(ex: ExpedienteFullResponse): BankReviewApplication {
  const history = ex.credit_history ?? {};
  const summary = (history.summary && typeof history.summary === "object" ? history.summary : {}) as Record<
    string,
    unknown
  >;
  const lpr = ex.decisions?.find((d) => d.kind === "last_process_result")?.payload;
  const bankDecision =
    (lpr && typeof lpr === "object" && (lpr as Record<string, unknown>).bank_decision) ||
    summary.bank_decision;
  const pilot_labels: PilotLabels = extractPilotLabels(ex);
  const declaracionRaw = summary.declaracion_vehiculo ?? (ex as { declaracion_vehiculo?: unknown }).declaracion_vehiculo;
  const declaracion_vehiculo =
    declaracionRaw && typeof declaracionRaw === "object"
      ? (declaracionRaw as DeclaracionVehiculoPayload)
      : undefined;

  return {
    application_id: ex.application_id,
    tenant_id: ex.tenant_id,
    state: ex.state ?? String(summary.state ?? "BANK_SUBMITTED"),
    application_payload: {
      applicant: ex.applicant,
      vehicle: ex.vehicle,
      financial: extractFinancial(summary, ex.financial),
      analysis: asAnalysis(summary, history.score),
      documents: ex.documents,
      bank_decision: bankDecision as BankReviewApplication["application_payload"]["bank_decision"],
      audit_trail: ex.audit_trail as BankReviewApplication["application_payload"]["audit_trail"],
      stipulations: ex.stipulations,
      offers: ex.offers,
      expediente_meta: {
        generated_at: ex.generated_at,
        completeness: ex.completeness,
      },
      pilot_labels,
      declaracion_vehiculo,
    },
  };
}
