/**
 * Marketing Core API facade — agents, campaigns, execution.
 * Same-origin BFF paths proxied to Render via next.config rewrites.
 */

import type { FetchSource } from "@/lib/api/client";
import {
  createMarketingCampaign,
  executeMarketingCampaign,
  fetchMarketingAgents,
  fetchMarketingCampaigns,
} from "@/lib/api/marketing";

export type MarketingAgent = Record<string, unknown>;
export type MarketingCampaign = Record<string, unknown>;

export type MarketingAgentsResult = {
  agents: MarketingAgent[];
  total: number;
  error: string | null;
  source: FetchSource;
};

export type MarketingCampaignsResult = {
  campaigns: MarketingCampaign[];
  total: number;
  error: string | null;
  source: FetchSource;
};

export type CreateCampaignResult = {
  ok: boolean;
  data: MarketingCampaign | null;
  error: string | null;
  status: number;
};

export type ExecuteCampaignResult = {
  ok: boolean;
  data: Record<string, unknown> | null;
  error: string | null;
  status: number;
};

/** GET /api/marketing/agents (backend discovery; paginated). */
export async function fetchAgents(
  tenantId?: string | null,
  limit = 1000,
): Promise<MarketingAgentsResult> {
  return fetchMarketingAgents(tenantId, limit);
}

/** GET /api/marketing/campaigns */
export async function fetchCampaigns(
  tenantId?: string | null,
): Promise<MarketingCampaignsResult> {
  return fetchMarketingCampaigns(tenantId);
}

/** POST /api/marketing/campaigns */
export async function createCampaign(
  tenantId: string,
  body: Record<string, unknown>,
): Promise<CreateCampaignResult> {
  return createMarketingCampaign(tenantId, body);
}

/** POST /api/marketing/campaigns/{id}/execute */
export async function executeCampaign(
  tenantId: string,
  campaignId: string,
  body: Record<string, unknown> = {},
): Promise<ExecuteCampaignResult> {
  return executeMarketingCampaign(tenantId, campaignId, body);
}

export function campaignDisplayName(row: MarketingCampaign): string {
  return String(row.name ?? row.title ?? row.campaign_name ?? "—");
}

export function campaignRowId(row: MarketingCampaign): string {
  return String(row.id ?? row.campaign_id ?? "");
}

export function campaignDisplayStatus(row: MarketingCampaign): string {
  return String(row.status ?? "draft");
}

export function agentDisplayName(agent: MarketingAgent): string {
  return String(agent.name ?? agent.title ?? agent.label ?? "Sin nombre");
}

export function agentRowId(agent: MarketingAgent): string {
  const raw = agent.id ?? agent.slug ?? agentDisplayName(agent);
  return String(raw);
}
