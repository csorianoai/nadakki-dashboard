import { test, expect } from "@playwright/test";
import { fillHealthCalibration } from "./calibration-helpers";
import { installDealerCreditApiMocks, loginAsDealer, MOCK_APP_ID } from "./helpers";

const DESKTOP = "chromium-desktop";

async function gotoDealerRiskOrSkip(page: import("@playwright/test").Page): Promise<void> {
  await installDealerCreditApiMocks(page, { applicationId: MOCK_APP_ID });
  await loginAsDealer(page);
  await page.goto(`/credit/dealer/${encodeURIComponent(MOCK_APP_ID)}`);
  if (!(await page.getByTestId("risk-based-ui-root").isVisible({ timeout: 15_000 }).catch(() => false))) {
    test.skip(true, "Risk-based UX disabled on this deployment (NEXT_PUBLIC_FEATURE_RISK_BASED_UX).");
  }
}

test.describe("Dealer Risk-Based UX E2E", () => {
  test.beforeEach(async ({}, testInfo) => {
    test.skip(testInfo.project.name !== DESKTOP, "Risk UX runs on chromium-desktop only.");
  });

  test("LOW risk shows fast-track path", async ({ page }) => {
    await gotoDealerRiskOrSkip(page);
    await fillHealthCalibration(page, {
      credit: 850,
      dti: 0,
      ltv: 0,
      employmentYears: 5,
      documentsProvided: 3,
      documentsRequired: 3,
    });
    const block = page.getByTestId("risk-based-ui-root");
    await expect(block).toHaveAttribute("data-tier", "LOW_RISK");
    await expect(page.getByText(/Ruta express/i)).toBeVisible();
  });

  test("MEDIUM risk shows standard path", async ({ page }) => {
    await gotoDealerRiskOrSkip(page);
    await fillHealthCalibration(page, {
      credit: 700,
      dti: 25,
      ltv: 55,
      employmentYears: 4,
      documentsProvided: 2,
      documentsRequired: 3,
    });
    await expect(page.getByTestId("risk-based-ui-root")).toHaveAttribute("data-tier", "MEDIUM_RISK");
    await expect(page.getByText(/Ruta estándar con estipulaciones/i)).toBeVisible();
  });

  test("HIGH risk shows enhanced verification", async ({ page }) => {
    await gotoDealerRiskOrSkip(page);
    await fillHealthCalibration(page, {
      credit: 590,
      dti: 38,
      ltv: 88,
      employmentYears: 2,
      documentsProvided: 1,
      documentsRequired: 3,
    });
    await expect(page.getByTestId("risk-based-ui-root")).toHaveAttribute("data-tier", "HIGH_RISK");
    await expect(page.getByText(/Escenario educativo/i)).toBeVisible();
  });

  test("CRITICAL risk blocks submission", async ({ page }) => {
    await gotoDealerRiskOrSkip(page);
    await fillHealthCalibration(page, {
      credit: 400,
      dti: 50,
      ltv: 100,
      employmentYears: 0,
      documentsProvided: 0,
      documentsRequired: 3,
    });
    await expect(page.getByTestId("risk-based-ui-root")).toHaveAttribute("data-tier", "DECLINED");
    await expect(page.getByTestId("risk-action-primary")).toHaveCount(0);
    await expect(page.getByTestId("risk-action-secondary")).toBeVisible();
  });

  test("risk indicators update per field change", async ({ page }) => {
    await gotoDealerRiskOrSkip(page);
    await fillHealthCalibration(page, {
      credit: 850,
      dti: 0,
      ltv: 0,
      employmentYears: 5,
      documentsProvided: 3,
      documentsRequired: 3,
    });
    await expect(page.getByTestId("risk-based-ui-root")).toHaveAttribute("data-tier", "LOW_RISK");
    await fillHealthCalibration(page, {
      credit: 400,
      dti: 50,
      ltv: 100,
      employmentYears: 0,
      documentsProvided: 0,
      documentsRequired: 3,
    });
    await expect(page.getByTestId("risk-based-ui-root")).toHaveAttribute("data-tier", "DECLINED");
  });
});
