"use client";

import { apiFetch } from "@/lib/api/fetch-client";
import type {
  Review,
  SubmitReviewResult,
  ReputationAnalytics,
  RespondReviewResult,
  ReviewSentiment,
  ReviewStatus,
} from "@/types/reviews-ai";

const BASE = "/api/v1/reviews_ai";

export async function requestReview(payload: {
  dealer_id: string;
  tenant_id: string;
  buyer_name: string;
  buyer_phone: string;
  vehicle_id?: string;
  channel?: string;
}): Promise<{ status: string; is_mock: boolean; review_link?: string; mock_note?: string }> {
  const res = await apiFetch(`${BASE}/request`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`request_review failed: ${res.status}`);
  return res.json();
}

export async function submitReview(payload: {
  dealer_id: string;
  tenant_id: string;
  buyer_name: string;
  buyer_phone?: string;
  vehicle_id?: string;
  rating: number;
  content: string;
  source?: string;
}): Promise<SubmitReviewResult> {
  const res = await apiFetch(`${BASE}/submit`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`submit_review failed: ${res.status}`);
  return res.json();
}

export async function listReviews(
  dealerId: string,
  tenantId: string,
  options?: {
    status?: ReviewStatus;
    sentiment?: ReviewSentiment;
    limit?: number;
    offset?: number;
  },
): Promise<{ reviews: Review[]; total: number; offset: number }> {
  const params = new URLSearchParams({ dealer_id: dealerId, tenant_id: tenantId });
  if (options?.status) params.set("status", options.status);
  if (options?.sentiment) params.set("sentiment", options.sentiment);
  if (options?.limit) params.set("limit", String(options.limit));
  if (options?.offset) params.set("offset", String(options.offset));
  const res = await apiFetch(`${BASE}/reviews?${params}`);
  if (!res.ok) throw new Error(`list_reviews failed: ${res.status}`);
  return res.json();
}

export async function respondToReview(
  reviewId: string,
  payload: {
    dealer_id: string;
    tenant_id: string;
    content?: string;
    use_ai?: boolean;
  },
): Promise<RespondReviewResult> {
  const res = await apiFetch(`${BASE}/respond/${reviewId}`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`respond_review failed: ${res.status}`);
  return res.json();
}

export async function flagReview(
  reviewId: string,
  payload: {
    dealer_id: string;
    tenant_id: string;
    reason?: string;
  },
): Promise<{ review_id: string; status: string; fraud_flagged: boolean }> {
  const res = await apiFetch(`${BASE}/flag/${reviewId}`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`flag_review failed: ${res.status}`);
  return res.json();
}

export async function getReputationAnalytics(
  dealerId: string,
  tenantId: string,
): Promise<ReputationAnalytics> {
  const params = new URLSearchParams({ dealer_id: dealerId, tenant_id: tenantId });
  const res = await apiFetch(`${BASE}/analytics?${params}`);
  if (!res.ok) throw new Error(`reputation_analytics failed: ${res.status}`);
  return res.json();
}
