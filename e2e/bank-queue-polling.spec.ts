import { test, expect } from "@playwright/test";
import { loginFromEnv, PLAYWRIGHT_BASE_URL } from "./bank-queue-login";

test("manual refresh triggers another queue fetch", async ({ page }) => {
  let hits = 0;
  await page.route("**/api/bank/applications/queue**", async (route) => {
    hits += 1;
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        applications: [
          {
            application_id: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
            dealer_name: "Dealer",
            borrower_name: "Borrower",
            amount: 90000,
            created_at: new Date().toISOString(),
            sla_deadline: new Date().toISOString(),
            hours_until_sla: 4,
            status: "pending",
            claimed_by: null,
            claimed_at: null,
            pti: 11,
            dti: 29,
          },
        ],
        total_count: 1,
        tenant_thresholds: {
          pti_green_max: 15,
          pti_amber_max: 20,
          pti_red_min: 21,
          dti_green_max: 36,
          dti_amber_max: 43,
          dti_red_min: 44,
        },
      }),
    });
  });

  await loginFromEnv(page);
  await page.goto(`${PLAYWRIGHT_BASE_URL}/bank/applications/queue`);
  await expect(page.getByRole("heading", { name: /Bandeja/i })).toBeVisible({ timeout: 25_000 });

  const initial = hits;
  await page.getByRole("button", { name: /Actualizar ahora/i }).click();
  await expect.poll(() => hits).toBeGreaterThan(initial);
});
