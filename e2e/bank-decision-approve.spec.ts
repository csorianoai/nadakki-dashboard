import { test, expect } from "@playwright/test";
import { BANK_E2E_TOKEN_KEY, makeBankE2eJwt, sampleDetailOwnedClaim } from "./bank-application-detail-helpers";

const APP_ID = "00000000-0000-4000-8000-000000000b01";

test.beforeEach(async ({ page }) => {
  await page.addInitScript(
    ([k, token]: [string, string]) => {
      localStorage.setItem(k, token);
    },
    [BANK_E2E_TOKEN_KEY, makeBankE2eJwt("tenant-e2e")],
  );
});

test("approve posts decide with idempotency key", async ({ page }) => {
  let posted: Record<string, unknown> | null = null;
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
    if (route.request().method() !== "POST") {
      await route.continue();
      return;
    }
    posted = JSON.parse(route.request().postData() || "{}");
    expect(route.request().headers()["idempotency-key"]).toBeTruthy();
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        decision_id: "dec-1",
        application_id: APP_ID,
        decision_type: "APPROVE",
        decided_at: new Date().toISOString(),
        event_id: "ev-1",
      }),
    });
  });

  await page.goto(`/bank/applications/${APP_ID}`);
  await page.getByRole("button", { name: /decisión/i }).click();
  await expect(page.getByRole("heading", { name: /decisión de crédito/i })).toBeVisible();

  const resPromise = page.waitForResponse(
    (r) => r.url().includes(`/applications/${APP_ID}/decide`) && r.request().method() === "POST",
  );

  await page.getByRole("radio", { name: /aprobar/i }).click();
  await page.getByRole("checkbox", { name: /RC001_APPROVE/i }).check();
  await page.getByRole("button", { name: /registrar decisión/i }).click();

  const res = await resPromise;
  expect(res.ok()).toBe(true);
  expect(posted?.decision_type).toBe("APPROVE");
});
