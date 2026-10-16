/** Tipos de GET /api/v1/realestate/broker-desk (C-RE-ALTA, G2-BROKER-DESK). Solo lectura; el tenant sale del token. */
export const ITEM_STATUSES = ["pending", "approved", "rejected", "cancelled"] as const;
export const ITEM_KINDS = ["agent_activation", "brand_publication"] as const;
export const AGENT_STATUSES = ["draft", "pending_approval", "active", "suspended", "offboarded"] as const;

export type ItemStatus = (typeof ITEM_STATUSES)[number];
export type ItemKind = (typeof ITEM_KINDS)[number];
export type AgentStatus = (typeof AGENT_STATUSES)[number];

export type Desk = { id: string; brokerage_id: string; created_at: string };
export type Summary = {
  brokerage_status: string;
  pending_by_kind: Partial<Record<ItemKind, number>>;
  agents_by_status: Partial<Record<AgentStatus, number>>;
  supervised_agent_counts: readonly { supervisor_agent_id: string; active_supervised: number }[];
  generated_at: string;
};
export type DeskItem = {
  id: string;
  kind: ItemKind;
  subject_label?: string | null;
  status: ItemStatus;
  decision_reason?: string | null;
  decided_at?: string | null;
  created_at: string;
};
export type ItemsPage = { items: readonly DeskItem[]; next_cursor: string | null };
