export type BankQueueSortKey = "sla_priority" | "created_at" | "hours_until_sla";

export type BankQueueStatusFilter = "pending" | "reviewing" | "decided";

export interface BankQueueTenantThresholds {
  pti_green_max: number;
  pti_amber_max: number;
  pti_red_min: number;
  dti_green_max: number;
  dti_amber_max: number;
  dti_red_min: number;
}

export interface BankQueueApplication {
  application_id: string;
  dealer_name: string;
  borrower_name: string;
  amount: number;
  created_at: string;
  sla_deadline: string;
  hours_until_sla: number;
  status: string;
  claimed_by: string | null;
  claimed_at: string | null;
  pti: number;
  dti: number;
}

export interface BankQueueApiResponse {
  applications: BankQueueApplication[];
  total_count: number;
  tenant_thresholds: BankQueueTenantThresholds;
}

export interface BankQueueFetchParams {
  status?: BankQueueStatusFilter | "";
  sortBy: BankQueueSortKey;
  limit: number;
  offset: number;
}
