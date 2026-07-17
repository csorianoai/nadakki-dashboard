"use client";

import { apiFetch } from "@/lib/api/fetch-client";
import type {
  GenerateCreativesResult,
  AdCampaign,
  CampaignObjective,
  CampaignOptimizationResult,
} from "@/types/ads-ai";

const BASE = "/api/v1/ads_ai";

export async function generateAdCreatives(payload: {
  dealer_id: string;
  tenant_id: string;
  vehicle_id?: string;
  campaign_objective?: CampaignObjective;
  platforms?: string[];
  budget_rd?: number;
  target_audience_notes?: string;
}): Promise<GenerateCreativesResult> {
  const res = await apiFetch(`${BASE}/generate_creatives`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`generate_creatives failed: ${res.status}`);
  return res.json();
}

export async function launchCampaign(payload: {
  dealer_id: string;
  tenant_id: string;
  vehicle_id?: string;
  name: string;
  objective: CampaignObjective;
  platforms: string[];
  daily_budget_rd: number;
  total_budget_rd?: number;
  start_date: string;
  end_date?: string;
  headlines?: string[];
  body_copies?: string[];
}): Promise<{ campaign_id: string; name: string; status: string; is_mock: boolean; mock_note?: string }> {
  const res = await apiFetch(`${BASE}/launch_campaign`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`launch_campaign failed: ${res.status}`);
  return res.json();
}

export async function listCampaigns(
  dealerId: string,
  tenantId: string,
  status?: string,
): Promise<{ campaigns: AdCampaign[]; total: number; is_mock: boolean }> {
  const params = new URLSearchParams({ dealer_id: dealerId, tenant_id: tenantId });
  if (status) params.set("status", status);
  const res = await apiFetch(`${BASE}/campaigns?${params}`);
  if (!res.ok) throw new Error(`list_campaigns failed: ${res.status}`);
  return res.json();
}

export async function getCampaignPerformance(
  campaignId: string,
  dealerId: string,
  tenantId: string,
): Promise<{ campaign_id: string; performance: Record<string, unknown>; is_mock: boolean }> {
  const params = new URLSearchParams({ dealer_id: dealerId, tenant_id: tenantId });
  const res = await apiFetch(`${BASE}/campaign/${campaignId}/performance?${params}`);
  if (!res.ok) throw new Error(`campaign_performance failed: ${res.status}`);
  return res.json();
}

export async function optimizeCampaign(
  campaignId: string,
  dealerId: string,
  tenantId: string,
): Promise<CampaignOptimizationResult> {
  const res = await apiFetch(`${BASE}/campaign/${campaignId}/optimize`, {
    method: "POST",
    body: JSON.stringify({ dealer_id: dealerId, tenant_id: tenantId }),
  });
  if (!res.ok) throw new Error(`optimize_campaign failed: ${res.status}`);
  return res.json();
}
