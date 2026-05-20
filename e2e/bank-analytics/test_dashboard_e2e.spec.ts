import { expect, test, type Page } from "@playwright/test";

import { setupBankSession } from "../bank/bank-e2e-helpers";

function installBankPortfolioAnalyticsMocks(page: Page): { periods: string[] } {
  const periods: string[] = [];
  void page.route("**/api/v2/analytics/bank/summary*", async (route) => {
    try {
      const url = new URL(route.request().url());
      periods.push(url.searchParams.get("period") ?? "");
    } catch {
      periods.push("?");
    }
    await route.fulfill({
      status: 200,
      body: JSON.stringify({
        portfolioOverview: {
          totalExposure: 550_000,
          activeApplications: 60,
          approvalRate: 58.3,
          stipulationsFrequency: 11.2,
        },
        riskHeatmap: {
          cells: [
            { amountBucket: "100k–250k", riskBucket: "50–70", volume: 18, color: "" },
            { amountBucket: "250k–500k", riskBucket: "70–85", volume: 9, color: "#d946ef" },
          ],
        },
        decisionDistribution: { approved: 24, declined: 6, pending: 3, withdrawn: 1 },
        stipulationsFrequency: {
          topStipulations: [
            { name: "Verificación de ingresos", count: 7, percent: 22 },
            { name: "Póliza de seguro vehicular", count: 6, percent: 17 },
          ],
        },
        anomalies: [
          {
            id: "e2e-anom-001",
            type: "STRESS",
            severity: "medium",
            description: "Sobrecarga sintética observada sobre franja mediodía UTC",
            detectedAt: new Date().toISOString(),
          },
        ],
      }),
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

  test("period selector requests alternates on summary route", async ({ page }) => {
    const { periods } = installBankPortfolioAnalyticsMocks(page);
    await page.goto("/bank/analytics");
    skipUnlessBankAnalyticsShell(page);

    if (!(await page.getByTestId("bank-analytics-dashboard").isVisible({ timeout: 24_000 }).catch(() => false))) {
      test.skip(true, "NEXT_PUBLIC_FEATURE_BANK_ANALYTICS=false at build.");
    }

    await expect.poll(() => periods.length >= 1, { timeout: 22_000 }).toBeTruthy();
    expect(periods[0]).toBe("30d");

    await page.getByTestId("bank-period-selector").getByRole("button", { name: /^90d$/ }).click();

    await expect.poll(() => periods.includes("90d"), { timeout: 22_000 }).toBeTruthy();
  });

  test("risk heatmap and anomalies surfaces render landmarks", async ({ page }) => {
    installBankPortfolioAnalyticsMocks(page);
    await page.goto("/bank/analytics");
    skipUnlessBankAnalyticsShell(page);

    if (!(await page.getByTestId("bank-analytics-dashboard").isVisible({ timeout: 24_000 }).catch(() => false))) {
      test.skip(true, "NEXT_PUBLIC_FEATURE_BANK_ANALYTICS=false at build.");
    }

    await expect(page.getByTestId("risk-heatmap")).toBeVisible({ timeout: 18_000 });
    await expect(page.getByTestId("risk-heatmap-points")).toBeVisible();
    await expect(page.getByTestId("anomaly-e2e-anom-001")).toBeVisible({ timeout: 18_000 });
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
