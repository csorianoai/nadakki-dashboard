"use client";

import { apiFetch } from "@/lib/api/fetch-client";
import type {
  SocialAccount,
  SocialPlatform,
  ScheduledPost,
  GeneratedContent,
  SocialAnalytics,
  AutoRespondResult,
  PostType,
  PostTone,
} from "@/types/social-ai";

const BASE = "/api/v1/social_ai";

export async function connectPlatform(
  platform: SocialPlatform,
  dealerId: string,
  tenantId: string,
): Promise<{ platform: string; status: string; is_mock: boolean; mock_note?: string }> {
  const res = await apiFetch(`${BASE}/connect/${platform}`, {
    method: "POST",
    body: JSON.stringify({ dealer_id: dealerId, tenant_id: tenantId }),
  });
  if (!res.ok) throw new Error(`connect_platform failed: ${res.status}`);
  return res.json();
}

export async function listSocialAccounts(
  dealerId: string,
  tenantId: string,
): Promise<{ accounts: SocialAccount[]; is_mock: boolean }> {
  const params = new URLSearchParams({ dealer_id: dealerId, tenant_id: tenantId });
  const res = await apiFetch(`${BASE}/accounts?${params}`);
  if (!res.ok) throw new Error(`list_accounts failed: ${res.status}`);
  return res.json();
}

export async function generateSocialContent(payload: {
  dealer_id: string;
  tenant_id: string;
  vehicle_id?: string;
  post_type?: PostType;
  tone?: PostTone;
  platforms?: SocialPlatform[];
  context_notes?: string;
}): Promise<GeneratedContent> {
  const res = await apiFetch(`${BASE}/generate_content`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`generate_content failed: ${res.status}`);
  return res.json();
}

export async function schedulePost(payload: {
  dealer_id: string;
  tenant_id: string;
  vehicle_id?: string;
  platforms: SocialPlatform[];
  post_type?: PostType;
  tone?: PostTone;
  ai_copy: string;
  ai_hashtags?: string[];
  media_urls?: string[];
  scheduled_at: string;
}): Promise<{ post_id: string; status: string; is_mock: boolean }> {
  const res = await apiFetch(`${BASE}/schedule_post`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`schedule_post failed: ${res.status}`);
  return res.json();
}

export async function listScheduledPosts(
  dealerId: string,
  tenantId: string,
  status?: string,
  limit = 20,
): Promise<{ posts: ScheduledPost[]; total: number; is_mock: boolean }> {
  const params = new URLSearchParams({ dealer_id: dealerId, tenant_id: tenantId, limit: String(limit) });
  if (status) params.set("status", status);
  const res = await apiFetch(`${BASE}/scheduled_posts?${params}`);
  if (!res.ok) throw new Error(`list_posts failed: ${res.status}`);
  return res.json();
}

export async function getSocialAnalytics(
  dealerId: string,
  tenantId: string,
  platform?: SocialPlatform,
): Promise<SocialAnalytics> {
  const params = new URLSearchParams({ dealer_id: dealerId, tenant_id: tenantId });
  if (platform) params.set("platform", platform);
  const res = await apiFetch(`${BASE}/analytics?${params}`);
  if (!res.ok) throw new Error(`social_analytics failed: ${res.status}`);
  return res.json();
}

export async function respondToComment(payload: {
  dealer_id: string;
  tenant_id: string;
  platform: SocialPlatform;
  interaction_type: "comment";
  original_message: string;
  vehicle_context?: string;
}): Promise<AutoRespondResult> {
  const res = await apiFetch(`${BASE}/respond_comment`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`respond_comment failed: ${res.status}`);
  return res.json();
}

export async function respondToDM(payload: {
  dealer_id: string;
  tenant_id: string;
  platform: SocialPlatform;
  interaction_type: "dm";
  original_message: string;
  vehicle_context?: string;
}): Promise<AutoRespondResult> {
  const res = await apiFetch(`${BASE}/respond_dm`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`respond_dm failed: ${res.status}`);
  return res.json();
}
