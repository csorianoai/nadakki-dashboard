import { CHApiError } from "../api/client";

/** Cold-start tolerant options for Render-backed analytics endpoints. */
export const ANALYTICS_QUERY_OPTIONS = {
  retry: (failureCount: number, error: unknown) => {
    if (error instanceof CHApiError && error.status === 404) return false;
    if (error instanceof CHApiError && error.status >= 400 && error.status < 500) return false;
    return failureCount < 2;
  },
  retryDelay: (attemptIndex: number) => Math.min(1000 * 2 ** attemptIndex, 8000),
} as const;

export function isAnalyticsUnavailable(error: unknown): boolean {
  return error instanceof CHApiError && error.status === 404;
}

export function isAnalyticsColdStartFailure(error: unknown): boolean {
  if (!(error instanceof CHApiError)) return false;
  return error.status === 408 || error.status === 504 || error.status >= 500;
}
