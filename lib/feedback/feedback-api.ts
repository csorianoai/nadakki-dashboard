import { apiFetch } from "@/lib/api/fetch-client";
import type { FeedbackPayload, NPSSummary } from "@/types/feedback";

export function isFeedbackEnabled(): boolean {
  return process.env.NEXT_PUBLIC_FEATURE_FEEDBACK === "true";
}

export async function submitFeedback(payload: FeedbackPayload): Promise<unknown> {
  const response = await apiFetch("/api/v2/feedback/submit", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    throw new Error(`Feedback submit failed: ${response.status}`);
  }
  return response.json();
}

export async function getNPSSummary(periodDays: number = 30): Promise<NPSSummary> {
  const response = await apiFetch(
    `/api/v2/feedback/nps/summary?period_days=${encodeURIComponent(String(periodDays))}`,
    { method: "GET" },
  );
  if (!response.ok) {
    throw new Error(`NPS summary failed: ${response.status}`);
  }
  return response.json() as Promise<NPSSummary>;
}
