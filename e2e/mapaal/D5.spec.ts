/**
 * D5 — Fotos de un vehiculo contra el contrato P4 parte 2 (#1501, backend #1549).
 *
 * Corre SOLO en el tenant QA con QA_USER / QA_PASSWORD contra BASE_URL. Sube
 * una foto, comprueba que el nombre original no viaja ni se pinta, prueba el
 * 422 de formato y borra lo que subio: deja el vehiculo como estaba.
 *
 * Variables: BASE_URL, QA_USER, QA_PASSWORD (obligatorias); QA_VEHICLE_ID
 * (opcional). El login va por `iniciarSesionQA`: si BASE_URL es el subdominio de
 * otro dealer (mapaal.nadakki.com), entra por el host universal con el tenant QA
 * y lleva la sesion a BASE_URL. Ultima linea: RESULT_D5=PASS|FAIL.
 */
import { expect, test, type Page } from "@playwright/test";

import { iniciarSesionQA } from "./sesion-qa";

const BASE_URL = (process.env.BASE_URL ?? "").replace(/\/+$/, "");
const QA_USER = process.env.QA_USER ?? "";
const QA_PASSWORD = process.env.QA_PASSWORD ?? "";
const NOMBRE_PERSONAL = "DNI-juan-perez.jpg";

test.describe.configure({ mode: "serial" });

let fallos = 0;
test.afterEach(({}, info) => void (info.status !== info.expectedStatus && (fallos += 1)));
test.afterAll(() => console.log(`RESULT_D5=${fallos === 0 ? "PASS" : "FAIL"}`));

async function vehiculoQa(page: Page): Promise<string> {
  if (process.env.QA_VEHICLE_ID) return process.env.QA_VEHICLE_ID;
  await page.goto(`${BASE_URL}/autos/dealer/inventario`);
  const link = page.locator('a[href^="/autos/dealer/inventario/"]').first();
  await expect(link, "el tenant QA no tiene vehiculos en el inventario").toBeVisible({ timeout: 60_000 });
  const href = (await link.getAttribute("href")) ?? "";
  return decodeURIComponent(href.split("/").pop() ?? "");
}

/** JPEG real, hecho por el navegador: un sello falso lo rechaza el backend con 422. */
async function jpegValido(page: Page): Promise<Buffer> {
  const b64 = await page.evaluate(() => {
    const canvas = document.createElement("canvas");
    Object.assign(canvas, { width: 64, height: 48 });
    canvas.getContext("2d")?.fillRect(0, 0, 64, 48);
    return canvas.toDataURL("image/jpeg", 0.8).split(",")[1];
  });
  return Buffer.from(b64, "base64");
}

test("D5 fotos: subir sin nombre personal, cortar formato, eliminar", async ({ browser }) => {
  test.setTimeout(240_000);
  expect(BASE_URL && QA_USER && QA_PASSWORD, "faltan BASE_URL / QA_USER / QA_PASSWORD").toBeTruthy();

  const page = await iniciarSesionQA(browser, { baseUrl: BASE_URL, usuario: QA_USER, clave: QA_PASSWORD });
  const vehicleId = await vehiculoQa(page);
  expect(vehicleId).not.toBe("");

  await page.goto(`${BASE_URL}/autos/dealer/inventario/${encodeURIComponent(vehicleId)}`);
  const gated = page.getByTestId("vehicle-photos-gated");
  const panel = page.getByTestId("vehicle-photos");
  await expect(panel.or(gated)).toBeVisible({ timeout: 60_000 });
  if (await gated.isVisible()) {
    throw new Error(`autos.inventory.photos denegada: ${await gated.getAttribute("data-reason-code")}`);
  }
  await expect(page.getByTestId("vehicle-photos-loading")).toHaveCount(0, { timeout: 30_000 });
  await expect(page.getByTestId("vehicle-photos-load-error")).toHaveCount(0);
  const antes = await page.getByTestId("vehicle-photo").count();

  const esPost = (method: string, url: string) => method === "POST" && /\/photos$/.test(new URL(url).pathname);

  // 1. Formato no admitido: 422 del backend, y el panel pide otro archivo.
  const [gif] = await Promise.all([
    page.waitForResponse((r) => esPost(r.request().method(), r.url())),
    page.getByTestId("vehicle-photos-input").setInputFiles({ name: "a.gif", mimeType: "image/gif", buffer: Buffer.from("GIF89a") }),
  ]);
  expect(gif.status()).toBe(422);
  await expect(page.getByTestId("vehicle-photos-error")).toHaveAttribute("data-kind", "otro_archivo");
  await expect(page.getByTestId("vehicle-photos-error")).toHaveAttribute("data-reason-code", /^unsupported_mime_type/);

  // 2. Subida: el multipart lleva `file` con nombre neutro, nunca el original.
  const buffer = await jpegValido(page);
  const [request, response] = await Promise.all([
    page.waitForRequest((r) => esPost(r.method(), r.url())),
    page.waitForResponse((r) => esPost(r.request().method(), r.url())),
    page.getByTestId("vehicle-photos-input").setInputFiles({ name: NOMBRE_PERSONAL, mimeType: "image/jpeg", buffer }),
  ]);
  const cuerpo = request.postDataBuffer()?.toString("latin1") ?? "";
  expect(cuerpo).toContain('name="file"');
  expect(cuerpo).not.toContain("juan");
  expect(request.headers()["x-tenant-id"]).toBeUndefined();
  expect(response.status(), await response.text()).toBe(201);
  const { media_id: mediaId } = (await response.json()) as { media_id: string };
  expect(mediaId).toBeTruthy();

  await expect(page.getByTestId("vehicle-photos-ack")).toHaveText("Foto subida.");
  await expect(page.getByTestId("vehicle-photo")).toHaveCount(antes + 1);
  const nueva = page.locator(`[data-testid="vehicle-photo"][data-media-id="${mediaId}"]`);
  await expect(nueva.locator("img")).toHaveAttribute("src", /^https:\/\//);
  await expect(page.getByTestId("vehicle-photos")).not.toContainText("juan");

  // 3. Eliminar deja el vehiculo como estaba.
  await nueva.getByRole("button", { name: /^Eliminar foto/ }).click();
  await expect(page.getByTestId("vehicle-photos-ack")).toHaveText("Foto eliminada.");
  await expect(page.getByTestId("vehicle-photo")).toHaveCount(antes);
});
