import type { DocumentCompleteness } from "@/lib/credit-api";

/** T6.4 App Health — weighted heuristic 0–100 for dealer-facing approval readiness. */

export interface ApplicationHealthData {
  credit_score?: number;
  dti_ratio?: number;
  /** LTV as percentage e.g. 85 for 85% */
  ltv_ratio?: number;
  employment_years?: number;
  documents_provided?: number;
  documents_required?: number;
}

export type HealthScoreZone = "excellent" | "good" | "fair" | "poor";

export interface HealthScoreFactorRow {
  id: string;
  label: string;
  /** Max contribution for this slice (sum of weighted maxima = ~100 only if all slices present). */
  weightPct: number;
  /** Actual points contributed for current data */
  contributed: number;
  /** True when backing field is missing → slice contributes 0 */
  unknown: boolean;
}

export interface HealthSuggestion {
  action: string;
  impact: string;
  priority: "high" | "medium" | "low";
}

const DOC_CATEGORIES_REQUIRED = 3;

export function calculateApplicationHealthScore(data: ApplicationHealthData): number {
  let score = 0;

  if (data.credit_score != null && !Number.isNaN(Number(data.credit_score))) {
    const creditFactor =
      Math.min(Math.max(Number(data.credit_score), 0), 850) / 850;
    score += creditFactor * 35;
  }

  if (data.dti_ratio != null && !Number.isNaN(Number(data.dti_ratio))) {
    const dti = Number(data.dti_ratio);
    const dtiFactor = Math.max(0, 1 - Math.min(Math.max(dti, 0), 50) / 50);
    score += dtiFactor * 25;
  }

  if (data.ltv_ratio != null && !Number.isNaN(Number(data.ltv_ratio))) {
    const ltv = Number(data.ltv_ratio);
    const ltvFactor = Math.max(0, 1 - Math.min(Math.max(ltv, 0), 100) / 100);
    score += ltvFactor * 20;
  }

  if (data.employment_years != null && !Number.isNaN(Number(data.employment_years))) {
    const y = Number(data.employment_years);
    const empFactor = Math.min(Math.max(y, 0), 5) / 5;
    score += empFactor * 10;
  }

  if (
    data.documents_provided != null &&
    data.documents_required != null &&
    Number(data.documents_required) > 0
  ) {
    const pct = Number(data.documents_provided) / Number(data.documents_required);
    const docFactor = Math.min(Math.max(pct, 0), 1);
    score += docFactor * 10;
  }

  return Math.round(score);
}

export function getHealthScoreZone(score: number): HealthScoreZone {
  if (score >= 80) return "excellent";
  if (score >= 60) return "good";
  if (score >= 40) return "fair";
  return "poor";
}

export function getHealthScoreFactors(
  data: ApplicationHealthData
): HealthScoreFactorRow[] {
  const rows: Omit<HealthScoreFactorRow, "contributed">[] = [
    { id: "credit", label: "Score crédito (35%)", weightPct: 35, unknown: data.credit_score == null },
    { id: "dti", label: "Ratio deuda-ingresos (25%) — menor mejor", weightPct: 25, unknown: data.dti_ratio == null },
    { id: "ltv", label: "LTV (20%) — menor mejor", weightPct: 20, unknown: data.ltv_ratio == null },
    {
      id: "employment",
      label: "Experiencia laboral (10%) — hasta 5 años",
      weightPct: 10,
      unknown: data.employment_years == null,
    },
    {
      id: "documents",
      label: "Documentación (10%)",
      weightPct: 10,
      unknown:
        data.documents_provided == null ||
        data.documents_required == null ||
        Number(data.documents_required ?? 0) <= 0,
    },
  ];

  return rows.map((r) => {
    let contributed = 0;
    switch (r.id) {
      case "credit":
        if (data.credit_score != null) {
          const creditFactor =
            Math.min(Math.max(Number(data.credit_score), 0), 850) / 850;
          contributed = creditFactor * 35;
        }
        break;
      case "dti":
        if (data.dti_ratio != null) {
          const dti = Number(data.dti_ratio);
          const dtiFactor = Math.max(0, 1 - Math.min(Math.max(dti, 0), 50) / 50);
          contributed = dtiFactor * 25;
        }
        break;
      case "ltv":
        if (data.ltv_ratio != null) {
          const ltv = Number(data.ltv_ratio);
          const ltvFactor = Math.max(0, 1 - Math.min(Math.max(ltv, 0), 100) / 100);
          contributed = ltvFactor * 20;
        }
        break;
      case "employment":
        if (data.employment_years != null) {
          const y = Number(data.employment_years);
          contributed = Math.min(Math.max(y, 0), 5) / 5 * 10;
        }
        break;
      case "documents":
        if (
          data.documents_provided != null &&
          data.documents_required != null &&
          Number(data.documents_required) > 0
        ) {
          const pct = Number(data.documents_provided) / Number(data.documents_required);
          contributed = Math.min(Math.max(pct, 0), 1) * 10;
        }
        break;
      default:
        break;
    }
    const roundedContrib = Math.round(contributed * 10) / 10;
    return { ...r, contributed: roundedContrib };
  });
}

export function getHealthScoreSuggestions(data: ApplicationHealthData): HealthSuggestion[] {
  const suggestions: HealthSuggestion[] = [];

  if (data.credit_score != null && data.credit_score < 680) {
    suggestions.push({
      action: "Add co-signer",
      impact: "+5 points",
      priority: "high",
    });
  }

  if (data.dti_ratio != null && data.dti_ratio > 36) {
    suggestions.push({
      action: "Increase down payment 5%",
      impact: "+3 points",
      priority: "medium",
    });
  }

  if (data.employment_years != null && data.employment_years < 2) {
    suggestions.push({
      action: "Verify employment 2+ years",
      impact: "+2 points",
      priority: "low",
    });
  }

  if (
    data.documents_provided != null &&
    data.documents_required != null &&
    data.documents_provided < data.documents_required
  ) {
    suggestions.push({
      action: "Submit missing documents",
      impact: "+2 points",
      priority: "high",
    });
    suggestions.push({
      action: "Submit recent paystubs",
      impact: "+2 points",
      priority: "medium",
    });
  }

  return suggestions;
}

/** Map dealer dossier + doc completeness → application health snapshot (best-effort). */
export function applicationDataFromDealerSources(input: {
  applicant?: Record<string, unknown> | null;
  vehicle?: Record<string, unknown> | null;
  aiScore?: number | null;
  ltvFraction?: number | null;
  completeness?: DocumentCompleteness | null;
}): ApplicationHealthData {
  const { applicant, vehicle, aiScore, ltvFraction, completeness } = input;

  let credit_score: number | undefined;
  if (applicant?.credit_score != null) {
    credit_score = Number(applicant.credit_score);
    if (Number.isNaN(credit_score)) credit_score = undefined;
  }
  if (credit_score == null && applicant?.creditScore != null) {
    credit_score = Number(applicant.creditScore);
    if (Number.isNaN(credit_score)) credit_score = undefined;
  }
  if (credit_score == null && aiScore != null && !Number.isNaN(Number(aiScore))) {
    const s = Number(aiScore);
    if (s >= 300 && s <= 850) credit_score = Math.round(s);
    else if (s >= 0 && s <= 100) credit_score = Math.round((s / 100) * 850);
  }

  let income: number | undefined;
  if (applicant?.monthly_income != null) {
    income = Number(applicant.monthly_income as number);
    if (Number.isNaN(income) || income <= 0) income = undefined;
  }

  let monthlyDebts: number | undefined;
  if (applicant?.monthly_debts != null) {
    monthlyDebts = Number(applicant.monthly_debts as number);
    if (Number.isNaN(monthlyDebts) || monthlyDebts < 0) monthlyDebts = undefined;
  }
  let dti_ratio: number | undefined;
  if (income != null && monthlyDebts != null) {
    dti_ratio = (monthlyDebts / income) * 100;
  }

  let ltv_ratio: number | undefined;
  if (ltvFraction != null && !Number.isNaN(ltvFraction)) {
    ltv_ratio = ltvFraction * 100;
  } else if (vehicle?.ltv_pct != null) {
    const p = Number(vehicle.ltv_pct);
    if (!Number.isNaN(p)) ltv_ratio = p;
  }

  let employment_years: number | undefined;
  const yKeys = ["employment_years", "years_at_employer", "years_employed", "experience_years"];
  for (const k of yKeys) {
    if (applicant?.[k] != null) {
      const y = Number(applicant[k] as number);
      if (!Number.isNaN(y)) {
        employment_years = y;
        break;
      }
    }
  }

  let documents_provided: number | undefined;
  let documents_required: number | undefined;
  documents_required = DOC_CATEGORIES_REQUIRED;
  if (completeness?.missing_categories) {
    const missing = completeness.missing_categories.length;
    documents_provided = Math.max(
      0,
      DOC_CATEGORIES_REQUIRED - missing
    );
  } else if (completeness?.completeness_pct != null) {
    documents_provided = Math.round((completeness.completeness_pct / 100) * DOC_CATEGORIES_REQUIRED);
    documents_provided = Math.min(DOC_CATEGORIES_REQUIRED, Math.max(0, documents_provided));
  }

  return {
    credit_score,
    dti_ratio,
    ltv_ratio,
    employment_years,
    documents_provided,
    documents_required,
  };
}
