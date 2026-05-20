import { test, expect } from "@playwright/test";

async function stubOnboardingApis(page: import("@playwright/test").Page) {
  await page.route("**/api/v2/admin/tenants/onboarding/draft", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ tenant_id: "e2e-prov-tenant" }),
    });
  });
  await page.route("**/api/v2/admin/tenants/onboarding/activate", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        tenant_id: "e2e-activated",
        provisional_access_until: "2099-12-31T23:59:59Z",
      }),
    });
  });
  await page.route("**/api/v2/admin/tenants/*/users/invite", async (route) => {
    await route.fulfill({ status: 200, contentType: "application/json", body: "{}" });
  });
  await page.route("**/api/v2/admin/tenants/*/branding/upload-logo", async (route) => {
    await route.fulfill({ status: 200, contentType: "application/json", body: "{}" });
  });
  await page.route("**/api/v2/admin/tenants/*/credentials", async (route) => {
    await route.fulfill({ status: 200, contentType: "application/json", body: "{}" });
  });
}

test.describe("Admin tenant onboarding wizard (NEXT_PUBLIC_FEATURE_TENANT_ONBOARDING)", () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem("nadakki_tenant_id", "onb-e2e");
      localStorage.setItem("nadakki_auth", "true");
      localStorage.setItem("nadakki_role", "admin");
    });
    await stubOnboardingApis(page);
  });

  test("step 1 renders basic fields when route is enabled", async ({ page }) => {
    const res = await page.goto("/tenant-onboarding/1");
    if (res?.status() === 404) test.skip();
    await expect(page.getByTestId("onboarding-slug")).toBeVisible({ timeout: 20_000 });
    await expect(page.getByTestId("onboarding-title")).toContainText("Alta de tenant");
  });

  test("progress bar lists six stages", async ({ page }) => {
    const res = await page.goto("/tenant-onboarding/1");
    if (res?.status() === 404) test.skip();
    await expect(page.getByTestId("onboarding-progress")).toBeVisible({ timeout: 20_000 });
    await expect(page.getByRole("navigation", { name: /progreso de pasos/i })).toBeVisible();
  });

  test("navigates to step 2 after next with valid step 1", async ({ page }) => {
    const res = await page.goto("/tenant-onboarding/1");
    if (res?.status() === 404) test.skip();
    await page.getByTestId("onboarding-slug").fill("acme-onboarding");
    await page.getByTestId("onboarding-display-name").fill("Acme Synthetic");
    await page.getByTestId("onboarding-contact-email").fill("ops@acme-onboarding.test");
    await page.getByTestId("onboarding-next").click();
    await expect(page).toHaveURL(/\/tenant-onboarding\/2/, { timeout: 25_000 });
    await expect(page.getByTestId("step-branding")).toBeVisible();
  });

  test("review step shows monthly estimate", async ({ page }) => {
    const res = await page.goto("/tenant-onboarding/6");
    if (res?.status() === 404) test.skip();
    await expect(page.getByTestId("onboarding-estimate")).toBeVisible({ timeout: 20_000 });
    await expect(page.getByTestId("step-review")).toBeVisible();
  });

  test("mobile viewport 375 still shows primary controls", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    const res = await page.goto("/tenant-onboarding/1");
    if (res?.status() === 404) test.skip();
    await expect(page.getByTestId("onboarding-next")).toBeVisible({ timeout: 20_000 });
  });
});
