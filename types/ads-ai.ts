// Ad Generation AI — Phase 9 types

export type CampaignObjective = "leads" | "awareness" | "traffic";
export type CampaignStatus = "draft" | "active" | "paused" | "completed" | "cancelled";

export interface AdAudience {
  name: string;
  description: string;
  estimated_reach: number;
}

export interface AdCreatives {
  headlines: string[];
  body_copies: string[];
  video_script: string;
  audiences: AdAudience[];
  cta_options: string[];
  ai_model: string;
}

export interface GenerateCreativesResult {
  vehicle_id?: string;
  objective: CampaignObjective;
  platforms: string[];
  creatives: AdCreatives;
  is_mock: boolean;
  mock_note?: string;
}

export interface AdCampaign {
  id: string;
  name: string;
  objective: CampaignObjective;
  status: CampaignStatus;
  platforms: string[];
  daily_budget_rd: number;
  total_budget_rd?: number;
  start_date: string;
  end_date?: string;
  performance: CampaignPerformance;
  is_mock: boolean;
}

export interface CampaignPerformance {
  impressions?: number;
  reach?: number;
  clicks?: number;
  leads?: number;
  spend_rd?: number;
  cpl_rd?: number;
  ctr_pct?: number;
  by_platform?: PlatformPerformance[];
}

export interface PlatformPerformance {
  platform: string;
  impressions: number;
  clicks: number;
  leads: number;
  spend_rd: number;
}

export interface OptimizationSuggestion {
  action: string;
  reason: string;
  priority: "high" | "medium" | "low";
}

export interface CampaignOptimizationResult {
  campaign_id: string;
  campaign_name: string;
  optimization_suggestions: OptimizationSuggestion[];
  is_mock: boolean;
}
