import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { setupCockpitE2e, waitForSessionReady } from "./finance-helpers";

const FINANCE_VIEWS = [
  { name: "revenue", path: "/cockpit/finance/revenue", testId: "finance-kpi-grid" },
  { name: "population-summary", path: "/cockpit/finance/population", testId: "population-tab-summary" },
  { name: "population-by-core", path: "/cockpit/finance/population?tab=by-core", testId: "population-tab-by-core" },
  { name: "population-by-family", path: "/cockpit/finance/population?tab=by-family", testId: "population-tab-by-family" },
  { name: "population-by-entity", path: "/cockpit/finance/population?tab=by-entity", testId: "population-tab-by-entity" },
  { name: "population-by-country", path: "/cockpit/finance/population?tab=by-country", testId: "population-tab-by-country" },
  { name: "population-digital-agents", path: "/cockpit/finance/population?tab=digital-agents", testId: "population-tab-digital-agents" },
  { name: "population-activity", path: "/cockpit/finance/population?tab=activity", testId: "population-tab-activity" },
  { name: "registry", path: "/cockpit/finance/registry", testId: "finance-registry-view" },
  { name: "matrix", path: "/cockpit/finance/matrix", testId: "finance-matrix-view" },
  { name: "tenant-detail", path: "/cockpit/finance/tenant/demo-tenant", testId: "finance-tenant-detail" },
] as const;

test.describe("Finance WCAG 2.1 AA — axe-core F7", () => {
  test.beforeEach(async ({ context, page }) => {
    await setupCockpitE2e(context, page, "platform_superadmin");
  });

  for (const view of FINANCE_VIEWS) {
    test(`${view.name}: zero critical axe violations`, async ({ page }) => {
      await page.goto(view.path);
      await waitForSessionReady(page);
      await expect(page.getByTestId(view.testId)).toBeVisible({ timeout: 15_000 });

      const results = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
        .analyze();

      const critical = results.violations.filter(
        (v) => v.impact === "critical" || v.impact === "serious",
      );
      expect(critical, JSON.stringify(critical, null, 2)).toHaveLength(0);
    });
  }
});

test.describe("Finance visual regression — F7 baseline", () => {
  test.beforeEach(async ({ context, page }) => {
    await setupCockpitE2e(context, page, "platform_superadmin");
  });

  const SCREENSHOT_VIEWS = FINANCE_VIEWS.slice(0, 8);

  for (const view of SCREENSHOT_VIEWS) {
    test(`${view.name}: screenshot baseline ≤0.1% diff`, async ({ page }) => {
      await page.goto(view.path);
      await waitForSessionReady(page);
      await expect(page.getByTestId(view.testId)).toBeVisible({ timeout: 15_000 });
      await page.waitForTimeout(500);
      await expect(page).toHaveScreenshot(`finance-${view.name}.png`, {
        maxDiffPixelRatio: 0.001,
        fullPage: true,
      });
    });
  }
});
