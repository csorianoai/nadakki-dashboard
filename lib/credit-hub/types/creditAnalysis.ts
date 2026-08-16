export type CreditRiskLevel = "BAJO" | "MEDIO_BAJO" | "MEDIO" | "ALTO" | "MUY_ALTO";
export type CreditApprovalBand = "PREAPROBABLE" | "REQUIERE_AJUSTE" | "REQUIERE_REVISION" | "NO_RECOMENDADO";

export interface CreditAnalysisRecommendation {
  type: string;
  title: string;
  current_value: number;
  recommended_value: number;
  estimated_new_payment: number;
  estimated_new_dti: number;
  estimated_new_score: number;
  impact: string;
  explanation: string;
}

export interface CreditAnalysisFactors {
  positive: string[];
  negative: string[];
}

export interface CreditAnalysisMetrics {
  monthly_income: number;
  monthly_debts: number;
  payment_capacity: number;
  debt_capacity: number;
  estimated_payment: number;
  financed_amount: number;
  dti: number;
  capacity_gap: number;
  annual_rate: number;
  term_months: number;
  down_payment: number;
  product_price: number;
  employment_years: number;
}

export interface CreditAnalysisResult {
  score: number;
  risk_level: CreditRiskLevel;
  approval_band: CreditApprovalBand;
  payment_capacity: number;
  estimated_payment: number;
  financed_amount: number;
  dti: number;
  pti?: number;
  ltv?: number;
  debt_capacity: number;
  factors: CreditAnalysisFactors;
  positive_factors: string[];
  negative_factors: string[];
  recommendations: CreditAnalysisRecommendation[];
  explanation: string;
  confidence: number;
  timestamp: string;
  version: "1.0.0";
  engine: "forge_rule_based_v1";
  metrics?: CreditAnalysisMetrics;
}
