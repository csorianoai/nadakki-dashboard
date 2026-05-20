import { test, expect } from "@playwright/test";

test.describe("Realtime workflow pages", () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem("nadakki_tenant_id", "e2e-realtime");
      window.localStorage.setItem("nadakki_auth", "true");
      window.localStorage.setItem("nadakki_role", "admin");
    });

    await page.route("**/api/v2/credit/applications/queue*", async (route) => {
      if (route.request().method() !== "GET") {
        await route.continue();
        return;
      }
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          applications: [
            {
              application_id: "00000000-0000-4000-8000-00000000e2e1",
              tenant_id: "e2e-realtime",
              state: "pending",
              applicant_name: "E2E Realtime",
              vehicle_label: "Test vehicle",
              score: 720,
              approval_band: "PREAPROBABLE",
              priority: "ALTA",
            },
          ],
          total: 1,
        }),
      });
    });
  });

  test("bank workflow-real shows queue table or empty state", async ({ page }) => {
    await page.goto("/workflow-real");
    await expect(page.getByTestId("workflow-real-page")).toBeVisible({ timeout: 25_000 });
    await expect(page.getByTestId("realtime-application-list")).toBeVisible();
  });

  test("dealer realtime page shows offer controls", async ({ page }) => {
    await page.goto("/credit/dealer/real");
    await expect(page.getByTestId("dealer-real-page")).toBeVisible({ timeout: 25_000 });
    await expect(page.getByTestId("dealer-simulate-offer")).toBeVisible();
  });

  test("simulate offer adds a row", async ({ page }) => {
    await page.goto("/credit/dealer/real");
    await page.getByTestId("dealer-simulate-offer").click();
    await expect(page.getByTestId("dealer-offer-row").first()).toBeVisible({ timeout: 10_000 });
  });

  test("live activity indicator is present on dealer page", async ({ page }) => {
    await page.goto("/credit/dealer/real");
    await expect(page.getByTestId("live-activity-indicator")).toBeVisible({ timeout: 15_000 });
  });

  test("workflow-real is usable at mobile width", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/workflow-real");
    await expect(page.getByTestId("realtime-refresh")).toBeVisible({ timeout: 20_000 });
  });
});
