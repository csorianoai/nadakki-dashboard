export type WorkflowStipulationStatus =
  | "pending"
  | "sent"
  | "in_progress"
  | "completed"
  | "rejected";

export type WorkflowAssignee = "dealer" | "customer";

export interface BankWorkflowStipulation {
  id: string;
  description: string;
  status: WorkflowStipulationStatus;
  assigned_to: WorkflowAssignee;
  deadline?: string;
  documents_uploaded: string[];
  template_id?: string;
  updated_at: string;
}

export interface WorkflowStipulationDraftPayload {
  description: string;
  assigned_to?: WorkflowAssignee;
  deadline?: string;
}
