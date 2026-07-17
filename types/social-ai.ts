// Social Media AI — Phase 9 types

export type SocialPlatform = "facebook" | "instagram" | "tiktok" | "youtube";
export type PostType = "feed" | "story" | "reel" | "short";
export type PostTone = "professional" | "casual" | "urgent";
export type PostStatus = "draft" | "scheduled" | "published" | "failed" | "cancelled";
export type SocialAccountStatus = "disconnected" | "connected" | "error" | "revoked";

export interface SocialAccount {
  platform: SocialPlatform;
  status: SocialAccountStatus;
  platform_account_id?: string;
  platform_page_name?: string;
  last_sync_at?: string;
  error_message?: string;
  is_mock: boolean;
}

export interface ScheduledPost {
  id: string;
  platforms: SocialPlatform[];
  post_type: PostType;
  tone: PostTone;
  ai_copy: string;
  ai_hashtags: string[];
  media_urls: string[];
  scheduled_at: string;
  published_at?: string;
  status: PostStatus;
  vehicle_id?: string;
  is_mock: boolean;
}

export interface GeneratedContent {
  copy: string;
  hashtags: string[];
  cta: string;
  ai_model: string;
  vehicle_id?: string;
  post_type: PostType;
  tone: PostTone;
  platforms: SocialPlatform[];
  is_mock: boolean;
}

export interface SocialAnalyticsPlatform {
  platform: SocialPlatform;
  impressions: number;
  reach: number;
  engagements: number;
  clicks: number;
  leads: number;
}

export interface SocialAnalytics {
  summary: {
    total_impressions: number;
    total_reach: number;
    total_engagements: number;
    total_clicks: number;
    total_leads_generated: number;
  };
  by_platform: SocialAnalyticsPlatform[];
  is_mock: boolean;
  mock_note?: string;
}

export interface AutoRespondResult {
  reply: string;
  platform: SocialPlatform;
  interaction_type: string;
  is_mock: boolean;
  original_message: string;
}
