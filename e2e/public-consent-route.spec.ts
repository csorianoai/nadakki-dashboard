import { test, expect } from "@playwright/test";

test("public consent route validates a token with the server before rendering", async ({ page }) => {
  const token = "route-token.with.dots";
  const statusUrl = `**/api/v2/credit/consent/${encodeURIComponent(token)}/status`;
  const publicUrl = `**/api/v2/credit/consent/${encodeURIComponent(token)}/public`;
  let statusRequests = 0;

  await page.route(statusUrl, async (route) => {
    statusRequests += 1;
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ status: "SENT" }),
    });
  });
  await page.route(publicUrl, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        application_id: "app-route-test",
        method: "EMAIL",
        institution_name: "Institución de prueba",
        branding: { logo_url: null, primary_color: "#2563eb" },
        regulatory_texts: { LEY_172_13: "Texto" },
        consents_required: ["LEY_172_13"],
        expires_at: "2099-01-01T00:00:00Z",
      }),
    });
  });

  await page.goto(`/consent/${token}`, { waitUntil: "domcontentloaded" });
  await expect(page.getByTestId("consent-checkboxes")).toBeVisible();
  expect(statusRequests).toBe(1);
  await expect(page.getByText("Institución de prueba", { exact: true })).toBeVisible();
});

test("public consent route rejects a token only after the status check fails", async ({ page }) => {
  const token = "invalid-route-token";
  const statusUrl = `**/api/v2/credit/consent/${encodeURIComponent(token)}/status`;
  const publicUrl = `**/api/v2/credit/consent/${encodeURIComponent(token)}/public`;
  let statusRequests = 0;
  let publicRequests = 0;

  await page.route(statusUrl, async (route) => {
    statusRequests += 1;
    await route.fulfill({
      status: 404,
      contentType: "application/json",
      body: JSON.stringify({ detail: "Token invalido" }),
    });
  });
  await page.route(publicUrl, async (route) => {
    publicRequests += 1;
    await route.fulfill({
      status: 500,
      contentType: "application/json",
      body: JSON.stringify({ detail: "public view should not be requested" }),
    });
  });

  await page.goto(`/consent/${token}`, { waitUntil: "domcontentloaded" });
  await expect(page.getByTestId("consent-invalid")).toBeVisible();
  expect(statusRequests).toBe(1);
  expect(publicRequests).toBe(0);
});
