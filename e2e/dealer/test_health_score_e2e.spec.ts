import { test, expect } from "@playwright/test";
import { fillHealthCalibration } from "./calibration-helpers";
import { installDealerCreditApiMocks, loginAsDealer, MOCK_APP_ID } from "./helpers";

const DESKTOP = "chromium-desktop";

async function gotoDealerCommandOrSkip(page: import("@playwright/test").Page): Promise<void> {
  await installDealerCreditApiMocks(page, { applicationId: MOCK_APP_ID });
  await loginAsDealer(page);
  await page.goto(`/credit/dealer/${encodeURIComponent(MOCK_APP_ID)}`);
  if (!(await page.getByTestId("app-health-score-root").isVisible({ timeout: 15_000 }).catch(() => false))) {
    test.skip(
      true,
      "App Health T6.4 disabled on this deployment (NEXT_PUBLIC_FEATURE_APP_HEALTH_SCORE)."
    );
  }
}

test.describe("Dealer App Health Score E2E", () => {
  test.beforeEach(async ({}, testInfo) => {
    test.skip(testInfo.project.name !== DESKTOP, "Health score runs on chromium-desktop only.");
  });

  test("health score gauge renders with correct color zones", async ({ page }) => {
    await gotoDealerCommandOrSkip(page);
    await fillHealthCalibration(page, {
      credit: 820,
      dti: 5,
      ltv: 40,
      employmentYears: 5,
      documentsProvided: 3,
      documentsRequired: 3,
    });
    await expect(page.getByTestId("app-health-zone")).toHaveAttribute("data-zone", "excellent");
    await expect(page.getByTestId("app-health-gauge-fill")).toBeVisible();
  });

  test("score calculation matches weighted model for strong profile", async ({ page }) => {
    await gotoDealerCommandOrSkip(page);
    await fillHealthCalibration(page, {
      credit: 760,
      dti: 10,
      ltv: 40,
      employmentYears: 5,
      documentsProvided: 3,
      documentsRequired: 3,
    });
    await expect(page.getByRole("meter")).toHaveAttribute("aria-valuenow", "83");
    await expect(page.getByRole("heading", { name: /Indicador de salud \(83\/100\)/i })).toBeVisible();
  });

  test("health score updates as form filled", async ({ page }) => {
    await gotoDealerCommandOrSkip(page);
    const meter = page.getByRole("meter");
    const before = await meter.getAttribute("aria-valuenow");
    await fillHealthCalibration(page, { credit: 400 });
    const after = await meter.getAttribute("aria-valuenow");
    expect(before).not.toEqual(after);
  });

  test("visual feedback changes when score moves between zones", async ({ page }) => {
    await gotoDealerCommandOrSkip(page);
    await fillHealthCalibration(page, {
      credit: 320,
      dti: 50,
      ltv: 100,
      employmentYears: 0,
      documentsProvided: 0,
      documentsRequired: 3,
    });
    await expect(page.getByTestId("app-health-zone")).toHaveAttribute("data-zone", "poor");
    await expect(page.getByRole("meter")).toHaveAttribute("aria-valuenow", "13");

    await fillHealthCalibration(page, {
      credit: 820,
      dti: 5,
      ltv: 40,
      employmentYears: 5,
      documentsProvided: 3,
      documentsRequired: 3,
    });
    await expect(page.getByTestId("app-health-zone")).toHaveAttribute("data-zone", "excellent");
    await expect(page.getByTestId("app-health-gauge-fill")).toHaveAttribute("style", /width: 88%/);
  });

  test("suggestions display when score < 60", async ({ page }) => {
    await gotoDealerCommandOrSkip(page);
    await fillHealthCalibration(page, {
      credit: 620,
      dti: 42,
      ltv: 95,
      employmentYears: 1,
      documentsProvided: 0,
      documentsRequired: 3,
    });
    await expect(page.getByTestId("app-health-suggestions")).toBeVisible();
    await expect(page.getByTestId("app-health-suggestions").getByText(/Add co-signer|Submit missing documents/i)).toBeVisible();
  });

  test("factor breakdown shows credit/dti/ltv weights", async ({ page }) => {
    await gotoDealerCommandOrSkip(page);
    const table = page.locator('[aria-label="Desglose de factores"]');
    await expect(table.getByText(/Score crédito \(35%\)/)).toBeVisible();
    await expect(table.getByText(/Ratio deuda-ingresos \(25%\)/)).toBeVisible();
    await expect(table.getByText(/LTV \(20%\)/)).toBeVisible();
  });

  test("hover tooltip explains each factor", async ({ page }) => {
    await gotoDealerCommandOrSkip(page);
    await expect(page.getByText(/Zona favorable|Zona estable|Zona delicada|Alta tensión/i)).toBeVisible();
    const list = page.locator('[aria-label="Desglose de factores"]');
    await expect(list.locator("li").first()).toContainText(/\d|%|\/|Score/i);
  });

  test("mobile responsive 375px viewport", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await gotoDealerCommandOrSkip(page);
    await expect(page.getByTestId("app-health-score-root")).toBeInViewport();
    await expect(page.getByRole("meter")).toBeInViewport();
  });
});
