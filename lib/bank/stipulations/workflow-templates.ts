/** Subset of backend ALLOWED_TYPES — must stay aligned with nadakki-ai-suite stipulations service. */
export type StipulationTemplateBackendType =
  | "cedula_front"
  | "cedula_back"
  | "income_proof_payroll"
  | "income_proof_bank_statement"
  | "address_proof"
  | "vehicle_invoice"
  | "vehicle_registration"
  | "co_signer_cedula"
  | "other";

export interface WorkflowStipulationTemplate {
  /** Stable slug for auditing + picker keys */
  id: string;
  label: string;
  backendType: StipulationTemplateBackendType;
  defaultDescription?: string;
}

/** Pre-defined checklist items bank analysts reuse (≥10 requirement). */
export const WORKFLOW_STIPULATION_TEMPLATES: WorkflowStipulationTemplate[] = [
  {
    id: "proof-of-insurance",
    label: "Proof of insurance",
    backendType: "other",
    defaultDescription: "Proof of insurance (póliza vigente)",
  },
  {
    id: "paystubs-3mo",
    label: "Recent paystubs (last 3 months)",
    backendType: "income_proof_payroll",
    defaultDescription: "Recent paystubs — last 3 months",
  },
  {
    id: "driver-license-copy",
    label: "Driver license copy",
    backendType: "cedula_front",
    defaultDescription: "Government-issued photo ID (front)",
  },
  {
    id: "co-signer-id",
    label: "Co-signer ID",
    backendType: "co_signer_cedula",
    defaultDescription: "Co-signer identification",
  },
  {
    id: "bank-statements-60d",
    label: "Bank statements (last 60 days)",
    backendType: "income_proof_bank_statement",
    defaultDescription: "Bank statements — last 60 days",
  },
  {
    id: "lease-mortgage-proof",
    label: "Lease/mortgage proof",
    backendType: "address_proof",
    defaultDescription: "Lease or mortgage payment proof",
  },
  {
    id: "vehicle-title-trade-in",
    label: "Vehicle title (if trade-in)",
    backendType: "vehicle_registration",
    defaultDescription: "Vehicle title or registration (trade-in)",
  },
  {
    id: "down-payment-proof",
    label: "Down payment verification",
    backendType: "other",
    defaultDescription: "Down payment verification (comprobante)",
  },
  {
    id: "employment-verification-letter",
    label: "Employment verification letter",
    backendType: "other",
    defaultDescription: "Employment verification letter (carta del empleador)",
  },
  {
    id: "tax-returns-2y",
    label: "Tax returns (last 2 years)",
    backendType: "other",
    defaultDescription: "Tax returns — last 2 years (DGII)",
  },
];
