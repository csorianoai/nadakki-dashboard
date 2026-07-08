/**
 * C4 authenticated smoke + screenshots for Credit Hub demo wiring.
 * Requires: SMOKE_EMAIL, SMOKE_PASSWORD, PREVIEW_URL (or BASE_URL).
 */
import { chromium } from "playwright";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, "..", "docs", "credit-hub-demo", "screenshots", "c4");

const API = process.env.NADAKKI_API_URL || process.env.NEXT_PUBLIC_NADAKKI_API_URL || "https://nadakki-ai-suite.onrender.com";
const BASE = (process.env.PREVIEW_URL || process.env.BASE_URL || "http://127.0.0.1:3000").replace(/\/$/, "");
const EMAIL = process.env.SMOKE_EMAIL;
const PASSWORD = process.env.SMOKE_PASSWORD;
const TENANT_SLUG = process.env.SMOKE_TENANT_SLUG || "nadakki-demo";

const ROUTES = [
  { name: "01-dealer-dashboard", url: "/credit-hub/dealer" },
  { name: "02-bank-dashboard", url: "/credit-hub/bank" },
  { name: "03-bank-queue", url: "/credit-hub/bank/applications" },
  {
    name: "04-bank-expediente-stipulations",
    url: "/credit-hub/bank/applications/d3b05eed-0000-0000-0000-000000000001",
  },
  { name: "05-dealer-applications", url: "/credit-hub/dealer/applications" },
];

async function loginViaApi() {
  if (!EMAIL || !PASSWORD) throw new Error("Set SMOKE_EMAIL and SMOKE_PASSWORD");
  const res = await fetch(`${API}/api/v2/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ email: EMAIL, password: PASSWORD, tenantSlug: TENANT_SLUG }),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`Login failed ${res.status}: ${JSON.stringify(body)}`);
  return body;
}

async function main() {
  fs.mkdirSync(OUT, { recursive: true });
  const login = await loginViaApi();
  const accessToken = login.access_token;
  const tenantId = login.tenant_info?.id || login.user_info?.tenant_id;

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });

  await context.addInitScript(
    ({ token, tid, tname, role }) => {
      localStorage.setItem("nadakki_sic_token", token);
      localStorage.setItem("nadakki_auth", "true");
      if (tid) localStorage.setItem("nadakki_tenant_id", tid);
      if (tname) localStorage.setItem("nadakki_tenant_name", tname);
      if (role) localStorage.setItem("nadakki_role", role);
    },
    {
      token: accessToken,
      tid: tenantId,
      tname: login.tenant_info?.display_name || TENANT_SLUG,
      role: login.active_role?.role_key || "bank_analyst",
    },
  );

  const page = await context.newPage();
  const manifest = [];

  for (const route of ROUTES) {
    const url = `${BASE}${route.url}`;
    await page.goto(url, { waitUntil: "networkidle", timeout: 120_000 });
    await page.waitForTimeout(1500);
    const file = path.join(OUT, `${route.name}.png`);
    await page.screenshot({ path: file, fullPage: true });
    const banner = await page.getByText("MODO DEMO").count();
    manifest.push({ route: route.name, url, screenshot: file, demoBannerVisible: banner > 0 });
    console.log(`OK ${route.name} banner=${banner > 0}`);
  }

  fs.writeFileSync(path.join(OUT, "manifest.json"), JSON.stringify({ captured_at: new Date().toISOString(), manifest }, null, 2));
  await browser.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
