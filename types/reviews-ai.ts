// Reviews & Reputation AI — Phase 9 types

export type ReviewSentiment = "positive" | "neutral" | "negative";
export type ReviewStatus = "pending" | "published" | "hidden" | "removed";
export type ReviewSource = "portal" | "whatsapp" | "google" | "facebook";
export type ReputationBadge = "bronze" | "silver" | "gold" | "platinum";

export interface ReviewResponse {
  content: string;
  is_ai_generated: boolean;
  published_at?: string;
}

export interface Review {
  id: string;
  buyer_name: string;
  rating: number; // 1-5
  content: string;
  sentiment?: ReviewSentiment;
  sentiment_score?: number;
  fraud_flagged: boolean;
  status: ReviewStatus;
  source: ReviewSource;
  verified_purchase: boolean;
  created_at: string;
  response?: ReviewResponse;
}

export interface SubmitReviewResult {
  review_id: string;
  status: ReviewStatus;
  sentiment: ReviewSentiment;
  sentiment_score: number;
  fraud_flagged: boolean;
  message: string;
}

export interface BadgeProgress {
  current: ReputationBadge;
  next?: ReputationBadge;
  reviews_needed: number;
  rating_needed: number;
}

export interface ReputationAnalytics {
  dealer_id: string;
  total_published: number;
  avg_rating: number;
  sentiment_breakdown: {
    positive: number;
    neutral: number;
    negative: number;
    positive_pct: number;
  };
  fraud_flagged: number;
  pending_moderation: number;
  response_rate_pct: number;
  reputation_badge: ReputationBadge;
  badge_progress: BadgeProgress;
}

export interface RespondReviewResult {
  review_id: string;
  response: string;
  is_ai_generated: boolean;
  published_at?: string;
  is_mock: boolean;
}
