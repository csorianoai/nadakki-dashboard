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
export function extractFinancial(summary: Record<string, unknown>, rootFinancial?: Record<string, unknown> | null): Record<string, unknown> {
  if (rootFinancial && typeof rootFinancial === "object") return rootFinancial as Record<string, unknown>;
  const fin = summary.financial ?? summary.financing ?? summary.loan;
  if (fin && typeof fin === "object") return fin as Record<string, unknown>;
  const out: Record<string, unknown> = {};
  for (const key of ["requested_amount", "down_payment", "term_months", "requested_rate", "ltv", "dti"] as const) {
    if (summary[key] != null) out[key] = summary[key];
  }
  return out;
}

/**
 * Normalize applicant data from backend (Spanish field names) to frontend contract (English).
 * Backend sends: ingreso_mensual, nombre_empleador, etc.
 * Frontend expects: monthly_income, employment, etc.
 */
function normalizeApplicant(
  raw: Record<string, unknown> | null | undefined,
  coFirmante?: Record<string, unknown> | null,
  referencias?: unknown[] | null
): Record<string, unknown> {
  if (!raw) return {};
  
  const normalized: Record<string, unknown> = { ...raw };
  
  // Map Spanish field names to English equivalents
  if (raw.ingreso_mensual != null) normalized.monthly_income = raw.ingreso_mensual;
  if (raw.nombre_empleador != null) normalized.employment = raw.nombre_empleador;
  if (raw.puesto_trabajo != null) normalized.job_title = raw.puesto_trabajo;
  if (raw.anos_empleo != null || raw.meses_empleo != null) {
    const years = Number(raw.anos_empleo ?? 0);
    const months = Number(raw.meses_empleo ?? 0);
    normalized.tenure_months = years * 12 + months;
  }
  if (raw.deudas_vigentes != null) normalized.current_debts = raw.deudas_vigentes;
  if (raw.pago_mensual_deudas != null) normalized.monthly_debt_payments = raw.pago_mensual_deudas;
  if (raw.nombre_completo != null) normalized.full_name = raw.nombre_completo;
  
  // Map co-firmante data
  if (coFirmante && typeof coFirmante === "object") {
    if (coFirmante.nombre_completo != null) normalized.co_borrower_name = coFirmante.nombre_completo;
    if (coFirmante.cedula != null) normalized.co_borrower_cedula = coFirmante.cedula;
    if (coFirmante.ingreso_mensual != null) normalized.co_borrower_monthly_income = coFirmante.ingreso_mensual;
    if (coFirmante.telefono != null) normalized.co_borrower_phone = coFirmante.telefono;
    if (coFirmante.relacion != null) normalized.co_borrower_relationship = coFirmante.relacion;
  }
  
  // Map referencias personales
  if (Array.isArray(referencias) && referencias.length > 0) {
    normalized.referencias = referencias.map((ref) => {
      if (typeof ref === "object" && ref != null) {
        const r = ref as Record<string, unknown>;
        return {
          nombre_completo: r.nombre || r.nombre_completo,
          telefono: r.telefono,
          relacion: r.relacion,
        };
      }
      return ref;
    });
  }
  
  return normalized;
}

/**
 * Normalize vehicle data from backend to frontend contract.
 */
function normalizeVehicle(raw: Record<string, unknown> | null | undefined): Record<string, unknown> {
  if (!raw) return {};
  
  const normalized: Record<string, unknown> = { ...raw };
  
  // Ensure both Spanish and English field names are available
  if (raw.marca != null) normalized.make = raw.marca;
  if (raw.modelo != null) normalized.model = raw.modelo;
  if (raw.ano != null) normalized.year = raw.ano;
  if (raw.condicion != null) normalized.condition = raw.condicion;
  if (raw.valuacion != null) normalized.value = raw.valuacion;
  
  return normalized;
}

/**
 * Normalize financial data from backend to frontend contract.
 */
function normalizeFinancial(raw: Record<string, unknown>): Record<string, unknown> {
  const normalized: Record<string, unknown> = { ...raw };
  
  if (raw.monto_solicitado != null) normalized.requested_amount = raw.monto_solicitado;
  if (raw.plazo_meses != null) normalized.term_months = raw.plazo_meses;
  if (raw.enganche != null) normalized.down_payment = raw.enganche;
  if (raw.fuente_enganche != null) normalized.down_payment_source = raw.fuente_enganche;
  
  return normalized;
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

  // Extract and normalize financial data
  const rawFinancial = extractFinancial(summary, ex.financial);
  const normalizedFinancial = normalizeFinancial(rawFinancial);

  // Use ex.analysis directly if available (contains pti, dti, ltv), fallback to summary
  const analysisData = ex.analysis || asAnalysis(summary, history.score);

  return {
    application_id: ex.application_id,
    tenant_id: ex.tenant_id,
    state: ex.state ?? String(summary.state ?? "BANK_SUBMITTED"),
    application_payload: {
      applicant: normalizeApplicant(
        ex.applicant as Record<string, unknown> | undefined,
        (ex as { co_firmante?: Record<string, unknown> }).co_firmante,
        (ex as { referencias_personales?: unknown[] }).referencias_personales
      ),
      vehicle: normalizeVehicle(ex.vehicle as Record<string, unknown> | undefined),
      financial: normalizedFinancial,
      analysis: analysisData as CreditAnalysisResult | undefined,
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
