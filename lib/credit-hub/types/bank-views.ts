import type { LucideIcon } from "lucide-react";
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

export type BankDetailTab = "analisis" | "documentos" | "stipulaciones" | "audit" | "compliance";

export type BankQueueSortKey = "priority" | "applicant_name" | "requested_amount" | "score" | "created_at";

export interface BankApplicantPayload {
  name?: string;
  full_name?: string;
  rfc?: string;
  age?: number;
  employment?: string;
  tenure_months?: number;
  monthly_income?: number;
  dependents?: number;
  city?: string;
}

export interface BankVehiclePayload {
  label?: string;
  make?: string;
  model?: string;
  vin?: string;
  value?: number;
  type?: string;
  dealer?: string;
}

export interface BankFinancialPayload {
  requested_amount?: number;
  down_payment?: number;
  term_months?: number;
  requested_rate?: number;
  ltv?: number;
  dti?: number;
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
  audit_trail?: unknown;
  identity?: import("@/lib/credit-hub/ch-types").IdentityEvidence;
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
