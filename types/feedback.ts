export interface FeedbackPayload {
  rating: number;
  comment?: string;
  context?: string;
  is_anonymous?: boolean;
}

export interface NPSSummary {
  score: number;
  promoters: number;
  passives: number;
  detractors: number;
  total: number;
  period_days: number;
}
