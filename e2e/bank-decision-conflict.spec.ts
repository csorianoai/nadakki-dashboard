import { test, expect } from "@playwright/test";
import { BANK_E2E_TOKEN_KEY, makeBankE2eJwt, sampleDetailOwnedClaim } from "./bank-application-detail-helpers";

const APP_ID = "00000000-0000-4000-8000-000000000b04";

test.beforeEach(async ({ page }) => {
  await page.addInitScript(
    ([k, token]: [string, string]) => {
      localStorage.setItem(k, token);
    },
    [BANK_E2E_TOKEN_KEY, makeBankE2eJwt("tenant-e2e")],
  );
});

test("409 decide shows recovery message in UI", async ({ page }) => {
  await page.route(`**/api/v2/credit/applications/${APP_ID}`, async (route) => {
    if (route.request().method() !== "GET") {
      await route.continue();
      return;
    }
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(sampleDetailOwnedClaim(APP_ID)),
    });
  });
  await page.route(`**/api/v2/credit/applications/${APP_ID}/decide`, async (route) => {
    await route.fulfill({
      status: 409,
      contentType: "application/json",
      body: JSON.stringify({ code: "CONFLICT" }),
    });
  });

  await page.goto(`/bank/applications/${APP_ID}`);
  await page.getByRole("button", { name: /decisión/i }).click();
  await page.getByRole("radio", { name: /aprobar/i }).click();
  await page.getByRole("checkbox", { name: /RC001_APPROVE/i }).check();
  await page.getByRole("button", { name: /registrar decisión/i }).click();
  await page.getByRole("button", { name: /registrar decisión/i }).waitFor({ state: "attached" });
});
