import { test, expect } from "@playwright/test";
import { Buffer } from "buffer";

/**
 * Run with a local Next server: `npm run dev` (port 3000), then
 * `npx playwright test e2e/mobile-upload-page.spec.ts`.
 * Viewport 375×667 per EP-T4-5.
 */

function makeToken(expOffsetSec: number): string {
  const payload = {
    v: 1,
    t: "11111111-1111-1111-1111-111111111111",
    a: "22222222-2222-2222-2222-222222222222",
    s: "33333333-3333-3333-3333-333333333333",
    d: "44444444-4444-4444-4444-444444444444",
    exp: Math.floor(Date.now() / 1000) + expOffsetSec,
    nonce: "nonce1",
  };
  const b64 = Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
  return `${b64}.sig`;
}

test.describe("EP-T4-5 mobile upload (375×667)", () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test("shows upload UI after validate succeeds", async ({ page }) => {
    const token = makeToken(7200);
    await page.route("**/upload-link/validate**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          stipulation_id: "33333333-3333-3333-3333-333333333333",
          max_size_mb: 5,
          allowed_types: ["application/pdf", "image/jpeg"],
        }),
      });
    });
    await page.goto(`/m/upload/${encodeURIComponent(token)}`);
    await expect(page.getByText(/elige o toma una foto/i)).toBeVisible({ timeout: 20_000 });
  });

  test("server-side preview rejects expired token", async ({ page }) => {
    const token = makeToken(-120);
    await page.goto(`/m/upload/${encodeURIComponent(token)}`);
    await expect(page.getByText(/expiró/i)).toBeVisible();
  });

  test("end-to-end upload with mocked backend", async ({ page }) => {
    const token = makeToken(7200);
    await page.route("**/upload-link/validate**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          stipulation_id: "33333333-3333-3333-3333-333333333333",
          max_size_mb: 5,
          allowed_types: ["application/pdf"],
        }),
      });
    });
    await page.route("**/stipulations/**/upload", async (route) => {
      if (route.request().method() !== "POST") {
        await route.continue();
        return;
      }
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          stipulation_id: "33333333-3333-3333-3333-333333333333",
          status: "uploaded",
          uploaded_doc_url: "https://example.invalid/doc",
          verification: { ok: true },
        }),
      });
    });

    await page.goto(`/m/upload/${encodeURIComponent(token)}`);
    await page.getByText(/elige o toma una foto/i).waitFor({ timeout: 20_000 });
    await page.locator("#pick").setInputFiles({
      name: "proof.pdf",
      mimeType: "application/pdf",
      buffer: Buffer.from("%PDF-1.4 test"),
    });
    await page.getByRole("button", { name: /enviar documento/i }).click();
    await expect(page.getByText(/recibimos tu documento/i)).toBeVisible({ timeout: 20_000 });
  });
});
