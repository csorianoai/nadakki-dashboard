import { expect, test } from "@playwright/test";
import { login } from "./login";

// SOLO LECTURA: entra a la Bandeja y cuenta filas. No pulsa nada que decida, asigne o borre.
test("P0: la Bandeja de bank-v2 carga con al menos una fila", async ({ page }) => {
  await login(page);
  await page.goto("/credit-hub/bank-v2/solicitudes");
  await expect(page).toHaveURL(/\/credit-hub\/bank-v2\/solicitudes/);
  await expect(page.getByTestId("bandeja-fila").first()).toBeVisible();
  expect(await page.getByTestId("bandeja-fila").count()).toBeGreaterThan(0);
  console.log("RESULT_BV2_P0=PASS");
});
