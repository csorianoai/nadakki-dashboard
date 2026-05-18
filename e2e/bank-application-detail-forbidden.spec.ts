import { test, expect } from "@playwright/test";
import { BANK_E2E_TOKEN_KEY, makeBankE2eJwt } from "./bank-application-detail-helpers";

const APP_ID = "00000000-0000-4000-8000-000000000003";

test.beforeEach(async ({ page }) => {
  await page.addInitScript(
    ([k, token]: [string, string]) => {
      localStorage.setItem(k, token);
    },
    [BANK_E2E_TOKEN_KEY, makeBankE2eJwt("tenant-e2e")],
  );
});

test("403 shows access denied", async ({ page }) => {
  await page.route(`**/api/v2/credit/applications/${APP_ID}`, async (route) => {
    await route.fulfill({
      status: 403,
      contentType: "application/json",
      body: JSON.stringify({ code: "FORBIDDEN" }),
    });
  });

  await page.goto(`/bank/applications/${APP_ID}`);
  await expect(page.getByRole("alert")).toBeVisible();
  await expect(page.getByText(/acceso denegado/i)).toBeVisible();
});
