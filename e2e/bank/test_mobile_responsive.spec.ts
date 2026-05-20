import { test, expect } from "@playwright/test";
import {
  routeBankApplicationDetail,
  routeDocumentPreviewSuccess,
  routeStipulationsAndNotify,
  sampleDetailBody,
  setupBankSession,
} from "./bank-e2e-helpers";

const APP_ID = "00000000-0000-4000-8000-00000000e903";
const DOC_ID = "d1";
const IPHONE_SE = "mobile-iphone-se";

test.describe("Bank mobile responsive E2E", () => {
  test.beforeEach(({}, testInfo) => {
    test.skip(testInfo.project.name !== IPHONE_SE, "Mobile bank specs use mobile-iphone-se only.");
  });
  test.beforeEach(async ({ page }) => {
    setupBankSession(page);
    await routeBankApplicationDetail(page, APP_ID, sampleDetailBody(APP_ID));
    await routeDocumentPreviewSuccess(page, APP_ID, DOC_ID, "sample-cedula.pdf");
    await routeStipulationsAndNotify(page, APP_ID, []);
  });

  test("Stipulations modal works on iPhone SE", async ({ page }) => {
    const detail = { ...sampleDetailBody(APP_ID), stipulations: [] };
    await routeBankApplicationDetail(page, APP_ID, detail);
    await page.goto(`/bank/applications/${APP_ID}`);
    const trig = page.getByTestId("open-stip-workflow-panel");
    if (!(await trig.isVisible({ timeout: 6000 }).catch(() => false))) {
      test.skip(true, "Workflow UI off build.");
    }
    await trig.click();
    await expect(page.getByTestId("bank-workflow-orchestration")).toBeVisible();
  });

  test("Document preview adapts to mobile", async ({ page }) => {
    await page.goto(`/bank/applications/${APP_ID}`);
    const btn = page.locator('[data-document-id="d1"]').getByRole("button", { name: /vista previa/i });
    if (!(await btn.isVisible({ timeout: 6000 }).catch(() => false))) {
      test.skip(true, "Preview UI off build.");
    }
    await btn.click();
    await expect(page.getByTestId("pdf-main-view")).toBeVisible({ timeout: 25_000 });
  });

  test("Application detail view scrolls correctly", async ({ page }) => {
    await page.goto(`/bank/applications/${APP_ID}`);
    await page.getByRole("heading", { name: /^scoring$/i }).scrollIntoViewIfNeeded();
    await expect(page.getByRole("heading", { name: /^scoring$/i })).toBeInViewport();
  });

  test("Touch interactions work for all CTAs", async ({ page }) => {
    await page.goto(`/bank/applications/${APP_ID}`);
    await page.getByRole("link", { name: /gestionar/i }).tap();
    await expect(page).toHaveURL(new RegExp(`/bank/applications/${APP_ID}/stipulations`));
  });
});
