import type { BankApplicationStipulation } from "@/lib/bank-application-detail/types";
import type { CreditStipulation, StipulationStatus } from "@/lib/api/stipulations-types";
import type { BankWorkflowStipulation, WorkflowStipulationStatus } from "./workflow-types";

/**
 * Guards workflow statuses that may move toward higher friction states.
 */
const TRANSITION_GRAPH: Record<WorkflowStipulationStatus, WorkflowStipulationStatus[]> = {
  pending: ["pending", "sent", "in_progress", "completed", "rejected"],
  sent: ["sent", "in_progress", "completed", "rejected"],
  in_progress: ["in_progress", "sent", "completed", "rejected"],
  completed: ["completed"],
  rejected: ["rejected", "pending", "sent", "in_progress"],
};

export function isLegalWorkflowStatusTransition(from: WorkflowStipulationStatus, to: WorkflowStipulationStatus): boolean {
  return TRANSITION_GRAPH[from]?.includes(to) ?? false;
}

export function normalizeWorkflowStatusFromString(raw?: string): WorkflowStipulationStatus {
  const s = (raw ?? "").trim().toLowerCase();
  if (s.includes("reject") || s.includes("declin")) return "rejected";
  if (s.includes("verif") || s.includes("complet") || s.includes("approve") || s.includes("verified")) return "completed";
  if (s.includes("upload") || s.includes("submit") || s.includes("progress")) return "in_progress";
  if (s.includes("sent")) return "sent";
  return "pending";
}

function creditStatusToWorkflow(status: StipulationStatus): WorkflowStipulationStatus {
  switch (status) {
    case "verified":
      return "completed";
    case "rejected":
      return "rejected";
    case "uploaded":
      return "in_progress";
    default:
      return "pending";
  }
}

export function workflowStipulationStatusToCreditApprox(s: WorkflowStipulationStatus): StipulationStatus {
  if (s === "completed") return "verified";
  if (s === "rejected") return "rejected";
  if (s === "in_progress" || s === "sent") return "uploaded";
  return "pending";
}

export function creditStipulationToWorkflowRow(cs: CreditStipulation): BankWorkflowStipulation {
  const docs: string[] = [];
  if (cs.document_id?.trim()) docs.push(cs.document_id.trim());
  return {
    id: cs.id.trim(),
    description: cs.description?.trim() || cs.title?.trim() || "Estipulación",
    status: creditStatusToWorkflow(cs.status),
    assigned_to: "dealer",
    deadline: undefined,
    documents_uploaded: docs,
    updated_at: cs.uploaded_at || cs.verified_at || cs.rejected_at || new Date().toISOString(),
  };
}

export function stipulationDetailToWorkflowRow(s: BankApplicationStipulation | undefined, index: number): BankWorkflowStipulation {
  const id = typeof s?.id === "string" && s.id.trim() ? s.id.trim() : `detail-${index}`;
  return {
    id,
    description: (s?.description ?? "Estipulación").trim() || "Estipulación",
    status: normalizeWorkflowStatusFromString(s?.status),
    assigned_to: "dealer",
    deadline: undefined,
    documents_uploaded: [],
    updated_at: new Date().toISOString(),
  };
}
