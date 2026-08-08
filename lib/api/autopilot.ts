/**
 * AME / Autopilot API client
 * Consumes backend endpoints for autonomous marketing engine operations.
 *
 * Note: /marketing/* endpoints are mounted WITHOUT /api/v1 prefix,
 * so they must be called directly against the backend URL.
 * /api/v1/scheduler/status goes through the Next.js catch-all proxy.
 */

const BACKEND_URL = (
  process.env.NEXT_PUBLIC_API_URL || "https://api.nadakki.com"
).replace(/\/$/, "");

function tenantHeaders(tenantId: string, role?: string): Record<string, string> {
  const h: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json",
    "X-Tenant-ID": tenantId,
  };
  if (role) h["X-Role"] = role;
  return h;
}

// ——— Types ———

export interface ActiveCampaignItem {
  campaign_id: string;
  name?: string;
  type?: string;
  status?: string;
  latest_autopilot?: {
    run_id: string;
    status: string;
    started_at?: string;
    completed_at?: string;
    duration_ms?: number;
    result_summary?: Record<string, unknown>;
  };
}

export interface ActiveCampaignsResponse {
  success: boolean;
  tenant_id: string;
  campaigns: ActiveCampaignItem[];
  total: number;
}

export interface BestActionItem {
  id: string;
  campaign_id: string;
  autopilot_run_id?: string;
  objective?: string;
  action_type: string;
  action_parameters: Record<string, unknown>;
  expected_improvement?: number;
  actual_improvement?: number;
  outcome?: string;
  applied_at?: string;
}

export interface BestActionsResponse {
  success: boolean;
  tenant_id: string;
  objective: string;
  best_actions: BestActionItem[];
}

export interface CycleTriggerResult {
  success?: boolean;
  status?: string;
  cycle_id?: string;
  campaigns_processed?: number;
  error?: string;
  [key: string]: unknown;
}

// ——— API functions ———

export async function fetchActiveCampaigns(
  tenantId: string,
  limit = 50,
): Promise<ActiveCampaignsResponse | null> {
  try {
    const res = await fetch(
      `${BACKEND_URL}/marketing/campaigns/active?limit=${limit}`,
      { headers: tenantHeaders(tenantId), cache: "no-store" },
    );
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export async function fetchBestActions(
  tenantId: string,
  objective = "lead_generation",
  limit = 5,
): Promise<BestActionsResponse | null> {
  try {
    const res = await fetch(
      `${BACKEND_URL}/marketing/campaigns/autopilot/best-actions?objective=${encodeURIComponent(objective)}&limit=${limit}`,
      { headers: tenantHeaders(tenantId), cache: "no-store" },
    );
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export async function triggerAutopilotCycle(
  tenantId: string,
  dryRun = true,
): Promise<CycleTriggerResult> {
  const res = await fetch(
    `${BACKEND_URL}/marketing/autopilot/cycle/trigger`,
    {
      method: "POST",
      headers: tenantHeaders(tenantId, "admin"),
      body: JSON.stringify({
        dry_run: dryRun,
        max_campaigns_per_tenant: 5,
        max_concurrent_campaigns: 3,
      }),
    },
  );
  if (res.status === 409) {
    return { success: false, error: "Ya hay un ciclo en ejecucion." };
  }
  if (res.status === 403) {
    return { success: false, error: "Acceso denegado. Se requiere rol admin." };
  }
  if (!res.ok) {
    return { success: false, error: `HTTP ${res.status}` };
  }
  return res.json();
}
