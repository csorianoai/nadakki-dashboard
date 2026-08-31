import type { LucideIcon } from "lucide-react";
import type { DeclaracionVehiculoPayload } from "@/lib/credit-hub/dealer/vehicle-declaration";
import type {
  BankAuditTrail,
  BankDashboardAnalytics,
  BankQueueItem,
  BankReviewApplication,
  ComplianceReport,
  CounterOffer,
} from "./bankDecision";
import type { CreditAnalysisResult } from "./creditAnalysis";
import type { RiskLevel } from "@/lib/credit-hub/ch-types";
import type { CreditProvenance } from "../labels/pilot-labels";

export type BankDetailTab = "analisis" | "documentos" | "stipulaciones" | "audit" | "compliance" | "verificaciones";

export type BankQueueSortKey = "priority" | "applicant_name" | "requested_amount" | "score" | "created_at";

export interface BankApplicantPayload {
  name?: string;
  full_name?: string;
  rfc?: string;
  age?: number;
  employment?: string;
  job_title?: string;
  tenure_months?: number;
  monthly_income?: number;
  dependents?: number;
  city?: string;
  current_debts?: number;
  monthly_debt_payments?: number;
  referencias?: Array<{ nombre_completo?: string; telefono?: string; relacion?: string; direccion?: string }>;
  co_borrower_name?: string;
  co_borrower_monthly_income?: number;
  co_borrower_cedula?: string;
  co_borrower_phone?: string;
  co_borrower_relationship?: string;
}

export interface BankVehiclePayload {
  label?: string;
  make?: string;
  marca?: string;
  model?: string;
  modelo?: string;
  year?: number;
  ano?: number;
  vin?: string;
  vin_chasis?: string;
  value?: number;
  valuacion?: number;
  type?: string;
  dealer?: string;
  condicion?: string;
  condition?: string;
}

export interface BankFinancialPayload {
  requested_amount?: number;
  down_payment?: number;
  term_months?: number;
  requested_rate?: number;
  ltv?: number;
  dti?: number;
  pti?: number;
  down_payment_source?: string;
}

export interface BankDocumentPayload {
  id?: string;
  name?: string;
  label?: string;
  kind?: string;
  type?: string;
  status?: string;
}

export interface BankReviewPayload {
  applicant?: BankApplicantPayload;
  vehicle?: BankVehiclePayload;
  financial?: BankFinancialPayload;
  analysis?: CreditAnalysisResult;
  documents?: BankDocumentPayload[];
  bank_decision?: unknown;
  bank_claims_by_lender?: Record<string, unknown>;
  audit_trail?: unknown;
  identity?: import("@/lib/credit-hub/ch-types").IdentityEvidence;
  pilot_labels?: {
    data_source_label?: string | null;
    kyc_mode?: string | null;
    ocr_mode?: string | null;
  };
  declaracion_vehiculo?: DeclaracionVehiculoPayload;
  expediente_meta?: Record<string, unknown>;
  credit_provenance?: CreditProvenance | null;
}

export interface ScoreDistribution {
  "300-579"?: number;
  "580-669"?: number;
  "670-739"?: number;
  "740-799"?: number;
  "800-850"?: number;
  [key: string]: number | undefined;
}

export interface PortfolioHealthPayload {
  score_distribution?: ScoreDistribution;
}

export interface BankDashboardViewProps {
  queue: BankQueueItem[];
  analytics?: BankDashboardAnalytics;
  institutionName: string;
  complianceSummary?: string;
  queueLoading?: boolean;
  analyticsLoading?: boolean;
  queueError?: boolean;
  analyticsError?: boolean;
  onRetryQueue?: () => void;
  onRetryAnalytics?: () => void;
}

export interface BankApplicationsTableProps {
  items: BankQueueItem[];
  total: number;
  page: number;
  pageSize: number;
  search: string;
  isLoading?: boolean;
  isError?: boolean;
  onSearchChange: (q: string) => void;
  onPageChange: (page: number) => void;
  onRetry?: () => void;
}

export interface BankDetailLayoutProps {
  application: BankReviewApplication;
  compliance?: ComplianceReport;
  audit?: BankAuditTrail;
  counterOffer?: CounterOffer;
  isComplianceLoading?: boolean;
}

export interface BankAnalyticsViewProps {
  analytics?: BankDashboardAnalytics;
  portfolioHealth?: PortfolioHealthPayload;
  dealers?: BankDashboardAnalytics["top_dealers"];
  isLoading?: boolean;
  isError?: boolean;
  onRetry?: () => void;
}

export interface BankAuditViewProps {
  events: BankAuditEventView[];
  isLoading?: boolean;
  isError?: boolean;
  onRetry?: () => void;
}

export interface BankAuditEventView {
  id: string;
  timestamp: string;
  actor: string;
  action: string;
  details?: Record<string, unknown>;
  applicationId?: string;
}

export interface BankComplianceIssueView {
  id: string;
  rule: string;
  severity: "alta" | "media" | "baja" | string;
  description: string;
  application_id: string;
}

export interface BankComplianceViewProps {
  issues: BankComplianceIssueView[];
  jurisdictionCode?: string;
  institutionName: string;
  isLoading?: boolean;
  isError?: boolean;
  onRetry?: () => void;
}

export interface EvidenceGridItemInput {
  icon?: LucideIcon;
  title: string;
  body: string;
  source?: string;
  conf?: "alto" | "medio" | "bajo";
}

/** Map backend risk strings to Package 0 RiskBand levels. */
export function mapBackendRiskLevel(risk: string | null | undefined): RiskLevel {
  const r = (risk ?? "").toUpperCase();
  if (r.includes("CRIT") || r.includes("MUY_ALTO")) return "critical";
  if (r === "ALTO" || r === "HIGH") return "high";
  if (r.includes("MEDIO") || r === "MEDIUM") return "medium";
  return "low";
}
