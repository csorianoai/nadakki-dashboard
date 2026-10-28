import { test, expect } from "@playwright/test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { sesion } from "../sesion";

/**
 * G2-PANEL-ALTA sobre el armazón de RE-SHELL: /realtor/alta (DEMO, paso 1) frente a la referencia DL10A
 * "Mi oficina" (alta.png; DL10A no tiene pantalla de alta propia), con el umbral de UMBRAL.md.
 */

const THRESHOLD = 0.12;
const REF = join(__dirname, "../../../docs/design/realtor/DL10A/ref/alta.png");


test("hitos del asistente: título, pasos y DEMO rotulado", async ({ page }) => {
  await sesion(page, 200);
  await page.goto("/realtor/alta");
  await expect(page.getByTestId("realtor-alta")).toBeVisible({ timeout: 30_000 });
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Alta del agente");
  await expect(page.getByTestId("badge-demo")).toBeVisible();
  await expect(page.getByLabel("Código de la licencia registrada")).toBeVisible();
});

test("captura a 1440×900 de /realtor/alta (DEMO, paso 1) frente a la referencia DL10A", async ({ page }, info) => {
  await sesion(page, 200);
  await page.goto("/realtor/alta");
  await expect(page.getByTestId("shell-sidebar")).toBeVisible({ timeout: 30_000 });
  await expect(page.getByTestId("realtor-alta")).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(500);
  const shot = await page.screenshot();
  await info.attach("alta", { body: shot, contentType: "image/png" });

  // Misma reducción que shell.spec.ts: canvas 144×90, escala de grises, diferencia media absoluta (0–1).
  const diff = await page.evaluate(async ({ a, b }) => {
    const gray = async (b64: string) => {
      const img = new Image();
      img.src = `data:image/png;base64,${b64}`;
      await img.decode();
      const c = document.createElement("canvas");
      c.width = 144; c.height = 90;
      const ctx = c.getContext("2d")!;
      ctx.drawImage(img, 0, 0, 144, 90);
      const d = ctx.getImageData(0, 0, 144, 90).data;
      const out: number[] = [];
      for (let i = 0; i < d.length; i += 4) out.push(0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2]);
      return out;
    };
    const [x, y] = [await gray(a), await gray(b)];
    return x.reduce((s, v, i) => s + Math.abs(v - y[i]), 0) / x.length / 255;
  }, { a: shot.toString("base64"), b: readFileSync(REF).toString("base64") });
  console.log(`DIFF_MEDIA=${(diff * 100).toFixed(2)}%`);
  expect(diff).toBeLessThanOrEqual(THRESHOLD);
});
