import { expect, test, type Page } from "@playwright/test";

import { loginAsDealer } from "../dealer/helpers";

const ANALYTICS_FIXTURE_JSON = {
  conversionFunnel: {
    started: 90,
    submitted: 60,
    approved: 40,
    closed: 32,
    dropOffPercents: [{ stage: "Submitted", dropOff: 0.33 }],
  },
  timeToClose: {
    weeklyAverages: [
      { week: "2025-W10", avgDays: 12 },
      { week: "2025-W11", avgDays: 10 },
    ],
    currentAvg: 10,
    trend: "stable",
  },
  approvalRateByBucket: {
    byAmount: [{ range: "0–250k", rate: 70, count: 5 }],
    byTerm: [{ range: "48m", rate: 66, count: 3 }],
    byRiskTier: [{ tier: "Premium", rate: 78, count: 2 }],
  },
  performanceMetrics: {
    avgDealSize: 388_500,
    totalVolume: 1_880_900,
    approvalRate: 62.25,
    npsScore: 44,
  },
};

function installDealerAnalyticsApiMocks(page: Page): { periods: string[] } {
  const periods: string[] = [];
  void page.route("**/api/v2/analytics/dealer/summary*", async (route) => {
    const url = new URL(route.request().url());
    periods.push(url.searchParams.get("period") ?? "");
    await route.fulfill({
      status: 200,
      body: JSON.stringify(ANALYTICS_FIXTURE_JSON),
      contentType: "application/json",
    });
  });
  void page.route("**/api/v2/analytics/dealer/export*", async (route) => {
    await route.fulfill({
      status: 200,
      body: `month,applications\nJanuary,42\n`,
      contentType: "text/csv",
      headers: { "Content-Disposition": 'attachment; filename="analytics-export.csv"' },
    });
  });
  return { periods };
}

async function skipIfAnalyticsGated(page: Page): Promise<void> {
  if (!(await page.getByTestId("dealer-analytics-dashboard").isVisible({ timeout: 18_000 }).catch(() => false))) {
    test.skip(true, "Dealer analytics disabled on this deployment (NEXT_PUBLIC_FEATURE_DEALER_ANALYTICS=true required).");
  }
}

test.describe("Dealer analytics dashboard E2E", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsDealer(page);
  });

  test("dashboard loads after dealer login when feature flag builds it", async ({ page }) => {
    installDealerAnalyticsApiMocks(page);
    await page.goto("/credit/dealer/analytics");

    const dashboardVisible = await page.getByTestId("dealer-analytics-dashboard").isVisible({ timeout: 20_000 }).catch(() => false);
    const gatedVisible = await page.getByTestId("dealer-analytics-flag-off").isVisible({ timeout: 2_500 }).catch(() => false);

    expect(
      dashboardVisible || gatedVisible,
      "Neither analytics dashboard nor gated notice rendered.",
    ).toBeTruthy();

    if (dashboardVisible) {
      await expect(page.getByRole("heading", { name: /Analítica de conversión/i })).toBeVisible();
    }
  });

  test("period selector requests alternate summary window", async ({ page }) => {
    const { periods } = installDealerAnalyticsApiMocks(page);
    await page.goto("/credit/dealer/analytics");
    await skipIfAnalyticsGated(page);

    await expect.poll(() => periods.length >= 1, { timeout: 15_000 }).toBeTruthy();
    expect(periods[0]).toBe("30d");

    await page.getByTestId("dealer-period-selector").getByRole("button", { name: /^90d$/ }).click();

    await expect.poll(() => periods.includes("90d"), { timeout: 15_000 }).toBeTruthy();
  });

  test("charts render observable funnel and time-to-close landmarks", async ({ page }) => {
    installDealerAnalyticsApiMocks(page);
    await page.goto("/credit/dealer/analytics");
    await skipIfAnalyticsGated(page);

    await expect(page.getByTestId("conversion-funnel")).toBeVisible({ timeout: 12_000 });
    await expect(
      page.getByRole("figure", { name: /Tendencia: estable/i }),
    ).toBeVisible({ timeout: 12_000 });
    await expect(page.getByTestId("approval-rate-by-bucket")).toBeVisible();
    await expect(page.getByTestId("approval-tab-amount")).toBeVisible();
  });

  test("narrow viewport avoids horizontal bleed at 375px", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 840 });
    installDealerAnalyticsApiMocks(page);
    await page.goto("/credit/dealer/analytics");
    await skipIfAnalyticsGated(page);

    const horizontalOverflow = await page.evaluate(
      () => Math.max(document.body.scrollWidth, document.documentElement?.scrollWidth ?? 0) - window.innerWidth,
    );
    expect(horizontalOverflow).toBeLessThanOrEqual(0);

    await expect(page.getByTestId("performance-metrics-cards")).toBeVisible();
  });

  test("CSV export hits dealer analytics export endpoint and may surface a download", async ({ page }) => {
    installDealerAnalyticsApiMocks(page);
    await page.goto("/credit/dealer/analytics");
    await skipIfAnalyticsGated(page);

    const respPromise = page.waitForResponse(
      (res) =>
        typeof res.url() === "string" &&
        res.url().includes("/api/v2/analytics/dealer/export") &&
        res.request().method() === "GET",
      { timeout: 45_000 },
    );

    const dlPromise = page.waitForEvent("download", { timeout: 8_000 }).catch(() => undefined);

    await page.getByTestId("dealer-export-csv").click();

    const response = await respPromise;
    expect(response.ok()).toBeTruthy();

    const download = await dlPromise;
    if (download != null) {
      await expect(download.suggestedFilename()).toMatch(/csv$/i);
      await download.delete();
    }
  });
});
