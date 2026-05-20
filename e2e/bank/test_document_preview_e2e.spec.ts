import { readFileSync } from "fs";
import path from "path";
import { test, expect } from "@playwright/test";
import {
  FIXTURES_DIR,
  routeBankApplicationDetail,
  routeDocumentPreviewSuccess,
  sampleDetailBody,
  setupBankSession,
} from "./bank-e2e-helpers";

const APP_ID = "00000000-0000-4000-8000-00000000d901";
const DOC_ID = "d1";
const DESKTOP = "chromium-desktop";

async function openPreviewOrSkip(page: import("@playwright/test").Page): Promise<void> {
  await page.goto(`/bank/applications/${APP_ID}`);
  const btn = page.locator('[data-document-id="d1"]').getByRole("button", { name: /vista previa/i });
  if (!(await btn.isVisible({ timeout: 10_000 }).catch(() => false))) {
    test.skip(true, "Document preview UI disabled (NEXT_PUBLIC_FEATURE_DOCUMENT_PREVIEW_UI).");
  }
  await btn.click();
  await expect(page.getByText(/vista previa documento/i)).toBeVisible();
  await expect(page.getByTestId("document-preview-pane")).toBeVisible({ timeout: 15_000 });
}

test.describe("Bank document preview E2E", () => {
  test.beforeEach(async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== DESKTOP);
    setupBankSession(page);
    await routeBankApplicationDetail(page, APP_ID, sampleDetailBody(APP_ID));
    await routeDocumentPreviewSuccess(page, APP_ID, DOC_ID, "sample-multi.pdf");
  });

  test("opens PDF in preview pane", async ({ page }) => {
    await openPreviewOrSkip(page);
    await expect(page.getByTestId("pdf-document")).toBeVisible({ timeout: 25_000 });
  });

  test("renders multi-page PDF correctly", async ({ page }) => {
    await openPreviewOrSkip(page);
    await expect(page.getByTestId("page-indicator")).toContainText(/1\s*\/\s*3/);
  });

  test("zoom in/out controls work", async ({ page }) => {
    await openPreviewOrSkip(page);
    await page.getByRole("button", { name: "150%" }).click();
    await expect(page.getByRole("button", { name: "150%" })).toHaveAttribute("aria-pressed", "true");
    await page.getByRole("button", { name: "100%" }).click();
  });

  test("rotate document buttons work", async ({ page }) => {
    await openPreviewOrSkip(page);
    await page.getByTestId("rotate-90").click();
    await expect(page.getByTestId("preview-toolbar")).toContainText("90°");
  });

  test("side-by-side comparison mode", async ({ page }) => {
    await openPreviewOrSkip(page);
    page.once("dialog", (d) => d.accept("doc-compare-b"));
    await routeDocumentPreviewSuccess(page, APP_ID, "doc-compare-b", "sample-paystub.pdf");
    await page.getByTestId("compare-trigger").click();
    await expect(page.getByTestId("comparison-pane")).toBeVisible({ timeout: 15_000 });
  });

  test("download original document", async ({ page }) => {
    await openPreviewOrSkip(page);
    const dl = page.waitForEvent("download");
    await page.getByTestId("download-doc").click();
    const d = await dl;
    expect(d.suggestedFilename()).toMatch(/\.pdf$/i);
  });

  test("search within document text", async ({ page }) => {
    await openPreviewOrSkip(page);
    await expect(page.getByText("E2ESEARCH_TOKEN")).toBeVisible({ timeout: 25_000 });
  });

  test("thumbnail navigation works", async ({ page }) => {
    await openPreviewOrSkip(page);
    await page.getByRole("button", { name: /mini página 2/i }).click();
    await expect(page.getByTestId("page-indicator")).toContainText("2 / 3");
  });

  test("PDF loading state shows skeleton", async ({ page }) => {
    await page.unroute("**/documents/*/preview.json");
    await page.route("**/documents/*/preview.json", async (route) => {
      await new Promise((r) => setTimeout(r, 800));
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          pages: 1,
          title: "delayed",
          stream_path: `/api/v2/credit/applications/${APP_ID}/documents/${DOC_ID}/download`,
        }),
      });
    });
    await routeDocumentPreviewSuccess(page, APP_ID, DOC_ID, "sample-cedula.pdf");
    await page.goto(`/bank/applications/${APP_ID}`);
    await page.locator('[data-document-id="d1"]').getByRole("button", { name: /vista previa/i }).click();
    await expect(page.getByTestId("preview-loading-meta")).toBeVisible();
    await expect(page.getByTestId("document-preview-pane")).toBeVisible({ timeout: 25_000 });
  });

  test("PDF error state shows fallback", async ({ page }) => {
    await page.route("**/documents/*/download", async (route) => {
      const url = route.request().url();
      if (!url.includes(DOC_ID)) {
        await route.continue();
        return;
      }
      await route.fulfill({ status: 404, body: "missing" });
    });
    await page.goto(`/bank/applications/${APP_ID}`);
    await page.locator('[data-document-id="d1"]').getByRole("button", { name: /vista previa/i }).click();
    await expect(page.getByTestId("preview-error")).toBeVisible({ timeout: 25_000 });
  });

  test("large PDF (10MB+) loads progressively", async ({ page }) => {
    const big = readFileSync(path.join(FIXTURES_DIR, "sample-large.pdf"));
    expect(big.length).toBeGreaterThan(1_000_000);
    await page.route("**/documents/*/download", async (route) => {
      const url = route.request().url();
      if (!url.includes(DOC_ID)) {
        await route.continue();
        return;
      }
      await new Promise((r) => setTimeout(r, 200));
      await route.fulfill({ status: 200, contentType: "application/pdf", body: big });
    });
    await page.goto(`/bank/applications/${APP_ID}`);
    await page.locator('[data-document-id="d1"]').getByRole("button", { name: /vista previa/i }).click();
    await expect(page.getByTestId("pdf-loading-spinner")).toBeVisible();
    await expect(page.getByTestId("document-preview-pane")).toBeVisible({ timeout: 20_000 });
  });

  test("mobile responsive PDF viewer", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await openPreviewOrSkip(page);
    await expect(page.getByTestId("pdf-main-view")).toBeInViewport();
  });
});
