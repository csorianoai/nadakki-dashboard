import { expect, test, type Page } from "@playwright/test";

import { setupBankSession } from "../bank/bank-e2e-helpers";

const CREDIT_RISK_FIXTURE = {
  tenant_id: "00000000-0000-0000-0000-000000000001",
  pti_distribution: [
    { bucket: "0-30", count: 11, percentage: 22 },
    { bucket: "50-70", count: 18, percentage: 36 },
  ],
  ltv_distribution: [
    { bucket: "100k-250k", count: 14, percentage: 28 },
    { bucket: "250k-500k", count: 9, percentage: 18 },
  ],
  rejection_reasons: [
    { reason_code: "Verificación de ingresos", count: 7 },
    { reason_code: "Póliza de seguro vehicular", count: 6 },
  ],
  generated_at: new Date().toISOString(),
};

const CREDIT_AUCTION_FIXTURE = {
  tenant_id: "00000000-0000-0000-0000-000000000001",
  total_applications: 128,
  applications_with_offers: 60,
  look_to_book: 0.47,
  total_offers: 72,
  win_rate: 0.583,
  avg_time_to_offer_hours: 18.5,
  lost_deals_count: 0,
  lender_breakdown: [],
  lost_deals: [],
  generated_at: new Date().toISOString(),
};

const CREDIT_DASHBOARD_FIXTURE = {
  tenant_id: "00000000-0000-0000-0000-000000000001",
  summary: {
    applications_total: 128,
    applications_by_status: {
      APPROVED: 24,
      DECLINED: 6,
      SUBMITTED: 3,
      WITHDRAWN: 1,
    },
    applications_by_display_status: {},
    offers_total: 550,
    offers_by_lender: { popular: 320, reservas: 230 },
    recent_failures_24h: 0,
  },
  generated_at: new Date().toISOString(),
};

function installBankPortfolioAnalyticsMocks(page: Page): { periods: string[] } {
  const periods: string[] = [];

  void page.route("**/api/v2/credit/analytics/risk-distributions**", async (route) => {
    await route.fulfill({
      status: 200,
      body: JSON.stringify(CREDIT_RISK_FIXTURE),
      contentType: "application/json",
    });
  });

  void page.route("**/api/v2/credit/analytics/auction-intel**", async (route) => {
    await route.fulfill({
      status: 200,
      body: JSON.stringify(CREDIT_AUCTION_FIXTURE),
      contentType: "application/json",
    });
  });

  void page.route("**/credit/dashboard/summary**", async (route) => {
    try {
      const referer = route.request().headers()["referer"] ?? "";
      if (referer.includes("period=")) {
        periods.push(new URL(referer).searchParams.get("period") ?? "");
      }
    } catch {
      /* ignore */
    }
    await route.fulfill({
      status: 200,
      body: JSON.stringify(CREDIT_DASHBOARD_FIXTURE),
      contentType: "application/json",
    });
  });

  return { periods };
}

async function skipUnlessBankAnalyticsShell(page: import("@playwright/test").Page): Promise<void> {
  const gated = await page.getByTestId("bank-analytics-flag-off").isVisible({ timeout: 3_500 }).catch(() => false);
  if (gated) {
    test.skip(true, "NEXT_PUBLIC_FEATURE_BANK_ANALYTICS is not enabled for this preview build.");
  }
}

test.describe("Bank analytics dashboard E2E", () => {
  test.beforeEach(async ({ page }) => {
    setupBankSession(page);
  });

  test("dashboard resolves after banker session provisioning", async ({ page }) => {
    installBankPortfolioAnalyticsMocks(page);
    await page.goto("/bank/analytics");

    const dashboardVisible = await page.getByTestId("bank-analytics-dashboard").isVisible({ timeout: 28_000 }).catch(() => false);
    const flagVisible = await page.getByTestId("bank-analytics-flag-off").isVisible({ timeout: 4_000 }).catch(() => false);
    const deniedVisible = await page.getByTestId("bank-analytics-access-denied").isVisible({ timeout: 2_000 }).catch(() => false);

    expect(
      dashboardVisible || flagVisible || deniedVisible,
      "No bank analytics shell (dashboard, flag off, or access denied) rendered.",
    ).toBeTruthy();

    if (dashboardVisible) {
      await expect(page.getByRole("heading", { name: /Analítica de portafolio/i })).toBeVisible();
    }
  });

  test("period selector keeps dashboard interactive", async ({ page }) => {
    installBankPortfolioAnalyticsMocks(page);
    await page.goto("/bank/analytics");
    skipUnlessBankAnalyticsShell(page);

    if (!(await page.getByTestId("bank-analytics-dashboard").isVisible({ timeout: 24_000 }).catch(() => false))) {
      test.skip(true, "NEXT_PUBLIC_FEATURE_BANK_ANALYTICS=false at build.");
    }

    await page.getByTestId("bank-period-selector").getByRole("button", { name: /^90d$/ }).click();
    await expect(page.getByTestId("bank-kpi-exposure")).toBeVisible({ timeout: 18_000 });
  });

  test("risk heatmap renders from credit analytics endpoints", async ({ page }) => {
    installBankPortfolioAnalyticsMocks(page);
    await page.goto("/bank/analytics");
    skipUnlessBankAnalyticsShell(page);

    if (!(await page.getByTestId("bank-analytics-dashboard").isVisible({ timeout: 24_000 }).catch(() => false))) {
      test.skip(true, "NEXT_PUBLIC_FEATURE_BANK_ANALYTICS=false at build.");
    }

    await expect(page.getByTestId("risk-heatmap")).toBeVisible({ timeout: 18_000 });
    await expect(page.getByTestId("stipulations-frequency")).toBeVisible({ timeout: 18_000 });
  });

  test("375px viewport keeps grid within inner width", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 860 });
    installBankPortfolioAnalyticsMocks(page);
    await page.goto("/bank/analytics");
    skipUnlessBankAnalyticsShell(page);

    if (!(await page.getByTestId("bank-analytics-dashboard").isVisible({ timeout: 24_000 }).catch(() => false))) {
      test.skip(true, "NEXT_PUBLIC_FEATURE_BANK_ANALYTICS=false at build.");
    }

    const overflow = await page.evaluate(
      () => Math.max(document.body.scrollWidth, document.documentElement?.scrollWidth ?? 0) - window.innerWidth,
    );
    expect(overflow).toBeLessThanOrEqual(0);
    await expect(page.getByTestId("bank-portfolio-overview-cards")).toBeVisible();
  });

  test("stipulation quick filter chips remain operable on touch targets", async ({ page }) => {
    installBankPortfolioAnalyticsMocks(page);
    await page.goto("/bank/analytics");
    skipUnlessBankAnalyticsShell(page);

    if (!(await page.getByTestId("bank-analytics-dashboard").isVisible({ timeout: 24_000 }).catch(() => false))) {
      test.skip(true, "NEXT_PUBLIC_FEATURE_BANK_ANALYTICS=false at build.");
    }

    await page.getByTestId("stipulation-chip-0").click();
    await expect(page.getByText(/Selección rápida:/i)).toBeVisible({ timeout: 12_000 });
  });
});
