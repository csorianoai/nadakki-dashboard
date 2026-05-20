import type { Page } from "@playwright/test";
import { expect, test } from "@playwright/test";

async function closeFeedbackModalIfOpen(page: Page) {
  const close = page.getByTestId("feedback-modal-close");
  if ((await close.count()) === 0) return;
  await close.click({ timeout: 2000 }).catch(() => undefined);
}

test.describe("feedback + NPS (compose FeedbackWidget/NPSPrompt in layout for green runs)", () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      try {
        localStorage.removeItem("nadakki_nps_last_shown");
      } catch {
        /* ignore */
      }
    });

    await page.route("**/api/v2/feedback/submit", async (route) => {
      const method = route.request().method();
      if (method === "POST") {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ ok: true }),
        });
        return;
      }
      await route.continue();
    });
  });

  test("feedback launcher exposes dialog landmarks when FeedbackWidget is mounted", async ({
    page,
  }) => {
    await page.goto("/login");

    const launcherCount = await page.getByTestId("feedback-widget-launcher").count();
    test.skip(launcherCount === 0, "Mount <FeedbackWidget /> and enable NEXT_PUBLIC_FEATURE_FEEDBACK.");

    await page.getByTestId("feedback-widget-launcher").click();
    await expect(page.getByRole("dialog")).toBeVisible({ timeout: 15_000 });
    await closeFeedbackModalIfOpen(page);
  });

  test("FeedbackModal exposes an accessible rating radiogroup", async ({ page }) => {
    await page.goto("/login");

    test.skip((await page.getByTestId("feedback-widget-launcher").count()) === 0);

    await page.getByTestId("feedback-widget-launcher").click();
    await expect(
      page.getByRole("radiogroup", { name: /Calificación de 1 a 5 estrellas/i }),
    ).toBeVisible({ timeout: 15_000 });
    await closeFeedbackModalIfOpen(page);
  });

  test("successful mocked submit reaches thank-you state", async ({ page }) => {
    await page.goto("/login");

    test.skip((await page.getByTestId("feedback-widget-launcher").count()) === 0);

    await page.getByTestId("feedback-widget-launcher").click();
    await expect(page.getByTestId("rating-star-5")).toBeVisible();
    await page.getByTestId("rating-star-4").click();
    await page.getByTestId("feedback-submit").click();
    await expect(page.getByTestId("feedback-thank-dismiss")).toBeVisible({ timeout: 20_000 });
    await closeFeedbackModalIfOpen(page);
  });

  test("launcher stays within viewport on a narrow mobile canvas", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });

    await page.goto("/login");

    test.skip((await page.getByTestId("feedback-widget-launcher").count()) === 0);

    const launcher = page.getByTestId("feedback-widget-launcher");

    await expect.poll(async () => {
      const b = await launcher.boundingBox();
      if (!b) return false;
      return b.x + b.width <= 392 && b.y + b.height <= 848;
    }).toBeTruthy();
  });

  test("auto-offered NPS shows score selector when composed", async ({ page }) => {
    await page.goto("/login");

    test.skip(
      (await page.getByTestId("nps-prompt-root").count()) === 0,
      'Mount <NPSPrompt autoOffer /> (cleared localStorage) to exercise NPS E2E.',
    );

    await expect(page.getByTestId("nps-score-selector")).toBeVisible({ timeout: 20_000 });
  });

  test("NPS promoter follow-up caption appears after choosing 10", async ({ page }) => {
    await page.goto("/login");

    test.skip((await page.getByTestId("nps-score-selector").count()) === 0);

    await page.getByTestId("nps-score-10").click();
    await expect(page.getByText(/¿Qué es lo que más te gustó/i)).toBeVisible();
    await page.getByTestId("nps-defer").click().catch(() => undefined);
  });
});
