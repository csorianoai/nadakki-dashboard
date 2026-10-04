/**
 * D7 — prueba de hecho del importador (contrato P5). SOLO tenant QA.
 * Sube a la REVISION (nunca aplicar) un fichero invalido: espera 200, ok=false,
 * FICHERO_ILEGIBLE y puedeAplicar=false. Sin ruta desplegada FALLA (no hay PASS falso).
 */
import { createHmac } from "node:crypto";
import { expect, test } from "@playwright/test";

const BASE_URL = process.env.BASE_URL ?? process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:3000";
const QA_USER = process.env.QA_USER ?? "";
const QA_PASSWORD = process.env.QA_PASSWORD ?? "";
const QA_TOTP_SECRET = process.env.QA_TOTP_SECRET ?? "";
const QA_DEALER_ID = process.env.QA_DEALER_ID ?? "";

function base32Decode(input: string): Buffer {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  let bits = "";
  for (const ch of input.replace(/=+$/g, "").replace(/\s+/g, "").toUpperCase()) {
    const idx = alphabet.indexOf(ch);
    if (idx < 0) throw new Error("QA_TOTP_SECRET no es base32");
    bits += idx.toString(2).padStart(5, "0");
  }
  const bytes: number[] = [];
  for (let i = 0; i + 8 <= bits.length; i += 8) bytes.push(parseInt(bits.slice(i, i + 8), 2));
  return Buffer.from(bytes);
}

function totp(secret: string): string {
  const counter = Buffer.alloc(8);
  counter.writeBigUInt64BE(BigInt(Math.floor(Date.now() / 30_000)));
  const hmac = createHmac("sha1", base32Decode(secret)).update(counter).digest();
  const offset = hmac[hmac.length - 1] & 0xf;
  const code = (hmac.readUInt32BE(offset) & 0x7fffffff) % 1_000_000;
  return String(code).padStart(6, "0");
}

test("D7: la revision del importador responde el contrato y un fichero invalido no se puede aplicar", async ({ page }) => {
  // apiFetch exige un backend declarado al cargarse: same-origin a BASE_URL.
  process.env.BACKEND_URL ??= BASE_URL;
  const { importActivosPath, parseImportResultado, puedeAplicar } = await import(
    "../../lib/dealer-management/import-activos"
  );

  expect(QA_USER, "QA_USER es obligatorio").not.toBe("");
  expect(QA_PASSWORD, "QA_PASSWORD es obligatorio").not.toBe("");
  expect(QA_DEALER_ID, "QA_DEALER_ID (dealer del tenant QA) es obligatorio").not.toBe("");

  await page.goto(`${BASE_URL}/login`);
  await page.getByLabel(/Email/i).fill(QA_USER);
  await page.getByLabel(/^Password/i).fill(QA_PASSWORD);
  await page.getByRole("button", { name: /Iniciar Sesi/i }).click();
  if (QA_TOTP_SECRET) {
    const otp = page.getByLabel(/c[oó]digo|totp|2fa/i).first();
    if (await otp.isVisible({ timeout: 10_000 }).catch(() => false)) {
      await otp.fill(totp(QA_TOTP_SECRET));
      await page.keyboard.press("Enter");
    }
  }
  await page.waitForURL((url) => !/\/login/.test(url.pathname), { timeout: 90_000 });

  const path = importActivosPath(QA_DEALER_ID, "revision");
  const respuesta = await page.evaluate(async (ruta) => {
    const form = new FormData();
    form.append("file", new Blob(["no es una plantilla"], { type: "application/zip" }), "no-es-plantilla.zip");
    const res = await fetch(ruta, { method: "POST", body: form, credentials: "include", headers: { Accept: "application/json" } });
    let body: unknown = null;
    try {
      body = await res.json();
    } catch {
      body = null;
    }
    return { status: res.status, body };
  }, path);

  // La ruta existe y revisar un fichero ilegible no es un error HTTP: es una revision con ERROR.
  expect(respuesta.status, `status ${respuesta.status} ${JSON.stringify(respuesta.body)}`).toBe(200);
  const resultado = parseImportResultado(respuesta.body, "revision");
  expect(resultado, "la respuesta no tiene la forma del contrato").not.toBeNull();
  expect(resultado?.aplicado).toBe(false);
  expect(resultado?.ok).toBe(false);
  expect(resultado?.errores.some((e) => e.codigo === "FICHERO_ILEGIBLE")).toBe(true);
  expect(puedeAplicar(resultado)).toBe(false);

  console.log("RESULT_D7=PASS");
});
