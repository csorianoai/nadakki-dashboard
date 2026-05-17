import { test, expect } from "@playwright/test";
import { loginFromEnv, PLAYWRIGHT_BASE_URL } from "./bank-queue-login";

test("claim POST navigates to detail route", async ({ page }) => {
  await page.route("**/api/bank/applications/queue**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        applications: [
          {
            application_id: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
            dealer_name: "Dealer",
            borrower_name: "Borrower",
            amount: 150000,
            created_at: new Date().toISOString(),
            sla_deadline: new Date().toISOString(),
            hours_until_sla: 6,
            status: "pending",
            claimed_by: null,
            claimed_at: null,
            pti: 13,
            dti: 31,
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

  await page.route("**/api/bank/applications/**/claim", async (route) => {
    await route.fulfill({
      status: 409,
      contentType: "application/json",
      body: JSON.stringify({ detail: "already_claimed" }),
    });
  });

  await loginFromEnv(page);
  await page.goto(`${PLAYWRIGHT_BASE_URL}/bank/applications/queue`);
  await page.getByRole("button", { name: /Revisar/i }).click();

  await page.waitForURL(/\/credit-hub\/bank\/applications\/bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb/, {
    timeout: 25_000,
  });

  await expect(page).toHaveURL(/credit-hub\/bank\/applications/);
});
