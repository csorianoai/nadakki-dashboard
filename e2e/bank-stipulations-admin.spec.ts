import { test, expect } from "@playwright/test";
import { BANK_E2E_TOKEN_KEY, makeBankE2eJwt } from "./bank-application-detail-helpers";

const APP_ID = "00000000-0000-4000-8000-000000000088";

function stipListBody(items: unknown[]) {
  return JSON.stringify({ data: { stipulations: items } });
}

test.describe("EP-T4-4 bank stipulations admin", () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(
      ([k, token, role]: [string, string, string]) => {
        localStorage.setItem(k, token);
        localStorage.setItem("nadakki_role", role);
      },
      [BANK_E2E_TOKEN_KEY, makeBankE2eJwt("tenant-e2e"), "admin"],
    );

    await page.route(`**/api/v2/credit/applications/${APP_ID}/stipulations`, async (route) => {
      const method = route.request().method();
      if (method === "GET") {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: stipListBody([
            { id: "s1", description: "Comprobante de ingresos", status: "uploaded" },
            { id: "s2", description: "Referencias", status: "pending" },
          ]),
        });
        return;
      }
      if (method === "POST" && route.request().url().includes("/s1/verify")) {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            data: { id: "s1", description: "Comprobante de ingresos", status: "verified" },
          }),
        });
        return;
      }
      if (method === "POST" && route.request().url().includes("/s2/reject")) {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            data: { id: "s2", description: "Referencias", status: "rejected" },
          }),
        });
        return;
      }
      await route.continue();
    });

    await page.route(`**/api/v2/credit/applications/${APP_ID}/stipulations/*/audit`, async (route) => {
      if (route.request().method() !== "GET") {
        await route.continue();
        return;
      }
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          events: [{ id: "e1", at: "2026-01-01T00:00:00Z", action: "upload", detail: "402-1234567-8" }],
        }),
      });
    });

    await page.route(`**/api/v2/credit/applications/${APP_ID}/stipulations/*/document`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/pdf",
        body: Buffer.from("%PDF-1.4 stub"),
      });
    });
  });

  test("loads stipulations list and shows manage affordances", async ({ page }) => {
    await page.goto(`/bank/applications/${APP_ID}/stipulations`);
    await expect(page.getByRole("heading", { name: /estipulaciones/i }).first()).toBeVisible();
    await expect(page.getByText("Comprobante de ingresos")).toBeVisible();
    await expect(page.getByRole("button", { name: /verificar/i }).first()).toBeVisible();
  });

  test("selecting card shows Históric section", async ({ page }) => {
    await page.goto(`/bank/applications/${APP_ID}/stipulations`);
    await page.getByTestId("stipulation-card-s1").click();
    await expect(page.getByText(/historial/i)).toBeVisible();
  });

  test("verify flow submits modal", async ({ page }) => {
    await page.goto(`/bank/applications/${APP_ID}/stipulations`);
    await page.getByTestId("stipulation-card-s1").getByRole("button", { name: /verificar/i }).click();
    await page.getByRole("button", { name: /confirmar verificación/i }).click();
    await expect(page.getByText(/verificada/i)).toBeVisible({ timeout: 8000 });
  });

  test("reject flow requires reason", async ({ page }) => {
    await page.goto(`/bank/applications/${APP_ID}/stipulations`);
    await page.getByTestId("stipulation-card-s2").getByRole("button", { name: /^rechazar$/i }).click();
    const rejectBtn = page.getByRole("dialog").getByRole("button", { name: /^rechazar$/i });
    await expect(rejectBtn).toBeDisabled();
    await page.getByLabel(/motivo/i).fill("Documento ilegible");
    await rejectBtn.click();
    await expect(page.getByText(/rechazada/i)).toBeVisible({ timeout: 8000 });
  });

  test("empty state when no stipulations", async ({ page }) => {
    const EMPTY_ID = "00000000-0000-4000-8000-000000000099";
    await page.route(`**/api/v2/credit/applications/${EMPTY_ID}/stipulations`, async (route) => {
      if (route.request().method() === "GET") {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: stipListBody([]),
        });
        return;
      }
      await route.continue();
    });
    await page.goto(`/bank/applications/${EMPTY_ID}/stipulations`);
    await expect(page.getByTestId("stipulations-empty")).toBeVisible();
  });
});
