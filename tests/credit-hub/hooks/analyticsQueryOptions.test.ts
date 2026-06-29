import { CHApiError } from "@/lib/credit-hub/api/client";
import { ANALYTICS_QUERY_OPTIONS, isAnalyticsUnavailable } from "@/lib/credit-hub/hooks/analyticsQueryOptions";

describe("analyticsQueryOptions", () => {
  test("isAnalyticsUnavailable detects 404", () => {
    expect(isAnalyticsUnavailable(new CHApiError("Not Found", 404))).toBe(true);
    expect(isAnalyticsUnavailable(new CHApiError("Timeout", 408))).toBe(false);
  });

  test("retry stops on 404 and allows up to 2 attempts on 5xx", () => {
    const retry = ANALYTICS_QUERY_OPTIONS.retry as (count: number, err: unknown) => boolean;
    expect(retry(0, new CHApiError("Not Found", 404))).toBe(false);
    expect(retry(0, new CHApiError("Server", 503))).toBe(true);
    expect(retry(2, new CHApiError("Server", 503))).toBe(false);
  });
});
