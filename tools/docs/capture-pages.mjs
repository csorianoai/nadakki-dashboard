/**
 * Capture 9 hero Credit Hub pages (desktop 1280x800 + mobile 375x667).
 * Requires: npm run build && npm run start (BASE_URL default http://127.0.0.1:3000).
 * Uses Playwright channel "msedge" when available (Windows), else bundled Chromium.
 */
import { chromium } from "playwright";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..", "..");
const OUT = path.join(ROOT, "app", "(forge)", "credit-hub", "_design", "_assets", "pages");
const BASE = process.env.BASE_URL || "http://127.0.0.1:3000";

/** @type {{ id: string; url: string; bank: boolean }[]} */
const PAGES = [
  { id: "dashboard", url: "/credit-hub/bank", bank: true },
  { id: "applications-list", url: "/credit-hub/bank/applications", bank: true },
  { id: "application-detail", url: "/credit-hub/bank/applications/APP-1847", bank: true },
  { id: "audit", url: "/credit-hub/bank/audit", bank: true },
  { id: "compliance", url: "/credit-hub/bank/compliance", bank: true },
  { id: "dashboard", url: "/credit-hub/dealer", bank: false },
  { id: "applications-list", url: "/credit-hub/dealer/applications", bank: false },
  { id: "application-detail", url: "/credit-hub/dealer/applications/APP-1847", bank: false },
  { id: "wizard-step1", url: "/credit-hub/dealer/applications/new/applicant", bank: false },
];

async function launchBrowser() {
  try {
    return await chromium.launch({ channel: "msedge", headless: true });
  } catch (e) {
    console.warn("capture-pages: msedge unavailable, using bundled Chromium:", e.message);
    return await chromium.launch({ headless: true });
  }
}

async function checkHealth() {
  const u = new URL("/credit-hub/preview", BASE);
  const ac = new AbortController();
  const t = setTimeout(() => ac.abort(), 12_000);
  try {
    const res = await fetch(u, { signal: ac.signal });
    clearTimeout(t);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
  } catch (e) {
    clearTimeout(t);
    throw new Error(
      `Cannot reach ${u.href} (${e.message}). Run: npm run build && npm run start — or set BASE_URL.`
    );
  }
}

async function captureViewport(browser, viewport, suffix) {
  const context = await browser.newContext({ viewport });
  const page = await context.newPage();
  for (const shot of PAGES) {
    const persona = shot.bank ? "bank" : "dealer";
    const dir = path.join(OUT, persona);
    fs.mkdirSync(dir, { recursive: true });
    const target = `${BASE}${shot.url}`;
    try {
      await page.goto(target, { waitUntil: "domcontentloaded", timeout: 90_000 });
      await new Promise((r) => setTimeout(r, 900));
      const file = path.join(dir, `${shot.id}-${suffix}.png`);
      await page.screenshot({ path: file, fullPage: false });
      console.log("OK", suffix, persona, shot.id);
    } catch (e) {
      console.error("FAIL", suffix, persona, shot.id, target, e.message);
      throw e;
    }
  }
  await context.close();
}

async function main() {
  await checkHealth();
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await launchBrowser();
  try {
    await captureViewport(browser, { width: 1280, height: 800 }, "desktop");
    await captureViewport(browser, { width: 375, height: 667 }, "mobile");
  } finally {
    await browser.close();
  }
  console.log("capture-pages: Done →", OUT);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
