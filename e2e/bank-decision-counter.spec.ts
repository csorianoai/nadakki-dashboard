import { test, expect } from "@playwright/test";
import { BANK_E2E_TOKEN_KEY, makeBankE2eJwt, sampleDetailOwnedClaim } from "./bank-application-detail-helpers";

const APP_ID = "00000000-0000-4000-8000-000000000b03";

test.beforeEach(async ({ page }) => {
  await page.addInitScript(
    ([k, token]: [string, string]) => {
      localStorage.setItem(k, token);
    },
    [BANK_E2E_TOKEN_KEY, makeBankE2eJwt("tenant-e2e")],
  );
});

test("counter posts counter_terms payload", async ({ page }) => {
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
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        decision_id: "dec-co",
        application_id: APP_ID,
        decision_type: "COUNTER",
        decided_at: new Date().toISOString(),
        counter_offer_id: "co-1",
      }),
    });
  });

  await page.goto(`/bank/applications/${APP_ID}`);
  await page.getByRole("button", { name: /decisión/i }).click();

  const resPromise = page.waitForResponse(
    (r) => r.url().includes(`/applications/${APP_ID}/decide`) && r.request().method() === "POST",
  );

  await page.getByRole("radio", { name: /contraoferta/i }).click();
  await page.getByRole("checkbox", { name: /RC201_COUNTER_AMOUNT/i }).check();

  await page.getByLabel(/Tasa anual/i).fill("13.5");

  await page.getByRole("button", { name: /registrar decisión/i }).click();
  await resPromise;
  expect(posted?.decision_type).toBe("COUNTER");
  expect((posted?.counter_terms as { amount?: number })?.amount).toBeGreaterThan(0);
});
