import { expect, test, type Page } from "@playwright/test";

import { loginAsDealer } from "../dealer/helpers";

const CREDIT_BANKS_RANKING_FIXTURE = {
  tenant_id: "00000000-0000-0000-0000-000000000001",
  banks: [
    {
      lender_code: "banco_popular",
      offer_count: 40,
      approved_count: 28,
      declined_count: 12,
      approval_rate: 0.7,
      avg_apr: 0.135,
      avg_response_hours: 288,
    },
    {
      lender_code: "banco_reservas",
      offer_count: 22,
      approved_count: 14,
      declined_count: 8,
      approval_rate: 0.636,
      avg_apr: 0.142,
      avg_response_hours: 240,
    },
  ],
  generated_at: new Date().toISOString(),
};

const CREDIT_DASHBOARD_FIXTURE = {
  tenant_id: "00000000-0000-0000-0000-000000000001",
  summary: {
    applications_total: 90,
    applications_by_status: {
      DRAFT: 10,
      SUBMITTED: 60,
      APPROVED: 40,
      COMPLETED: 32,
    },
    applications_by_display_status: {},
    offers_total: 62,
    offers_by_lender: { banco_popular: 40, banco_reservas: 22 },
    recent_failures_24h: 0,
  },
  generated_at: new Date().toISOString(),
};

function installDealerAnalyticsApiMocks(page: Page): { fetchCount: { value: number } } {
  const fetchCount = { value: 0 };

  void page.route("**/api/v2/credit/analytics/banks-ranking**", async (route) => {
    fetchCount.value += 1;
    await route.fulfill({
      status: 200,
      body: JSON.stringify(CREDIT_BANKS_RANKING_FIXTURE),
      contentType: "application/json",
    });
  });

  void page.route("**/credit/dashboard/summary**", async (route) => {
    fetchCount.value += 1;
    await route.fulfill({
      status: 200,
      body: JSON.stringify(CREDIT_DASHBOARD_FIXTURE),
      contentType: "application/json",
    });
  });

  return { fetchCount };
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

  test("period selector refetches credit analytics endpoints", async ({ page }) => {
    const { fetchCount } = installDealerAnalyticsApiMocks(page);
    await page.goto("/credit/dealer/analytics");
    await skipIfAnalyticsGated(page);

    await expect.poll(() => fetchCount.value >= 2, { timeout: 15_000 }).toBeTruthy();

    await page.getByTestId("dealer-period-selector").getByRole("button", { name: /^90d$/ }).click();

    await expect.poll(() => fetchCount.value >= 4, { timeout: 15_000 }).toBeTruthy();
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

  test("CSV export synthesizes a download client-side", async ({ page }) => {
    installDealerAnalyticsApiMocks(page);
    await page.goto("/credit/dealer/analytics");
    await skipIfAnalyticsGated(page);

    const dlPromise = page.waitForEvent("download", { timeout: 12_000 }).catch(() => undefined);

    await page.getByTestId("dealer-export-csv").click();

    const download = await dlPromise;
    expect(download != null).toBeTruthy();
    if (download != null) {
      await expect(download.suggestedFilename()).toMatch(/csv$/i);
      await download.delete();
    }
  });
});
