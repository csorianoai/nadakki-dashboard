/**
 * Capture Phase 6 reusability screenshots (1280x800 desktop, 375x667 mobile).
 * Requires dev or production server on BASE_URL (default http://127.0.0.1:3000).
 * Run after: NEXT_PUBLIC_FORGE_TEST_TENANT=mx npm run build && npm run start
 */
import { chromium } from "playwright";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const OUT = path.join(ROOT, "app", "(forge)", "credit-hub", "_design", "_inventory", "reusability-test");

const BASE = process.env.BASE_URL || "http://127.0.0.1:3000";

const SHOTS = [
  { name: "bank-dashboard", url: "/credit-hub/bank" },
  { name: "bank-applications-list", url: "/credit-hub/bank/applications" },
  { name: "bank-application-detail", url: "/credit-hub/bank/applications/APP-1847" },
  { name: "bank-audit", url: "/credit-hub/bank/audit" },
  { name: "bank-compliance", url: "/credit-hub/bank/compliance" },
  { name: "dealer-dashboard", url: "/credit-hub/dealer" },
  { name: "dealer-applications-list", url: "/credit-hub/dealer/applications" },
  { name: "dealer-applications-new-step1", url: "/credit-hub/dealer/applications/new/applicant" },
  { name: "dealer-applications-detail", url: "/credit-hub/dealer/applications/APP-1847" },
  { name: "preview", url: "/credit-hub/preview" },
];

async function capture(viewport, subdir) {
  const dir = path.join(OUT, subdir);
  fs.mkdirSync(dir, { recursive: true });
  const browser = await chromium.launch({ channel: "msedge", headless: true });
  const context = await browser.newContext({ viewport });
  const page = await context.newPage();
  for (const { name, url } of SHOTS) {
    const target = `${BASE}${url}`;
    try {
      await page.goto(target, { waitUntil: "domcontentloaded", timeout: 90_000 });
      await new Promise((r) => setTimeout(r, 800));
      await page.screenshot({ path: path.join(dir, `${name}.png`), fullPage: false });
      console.log("OK", subdir, name);
    } catch (e) {
      console.error("FAIL", subdir, name, target, e.message);
    }
  }
  await browser.close();
}

async function main() {
  fs.mkdirSync(OUT, { recursive: true });
  await capture({ width: 1280, height: 800 }, "desktop");
  await capture({ width: 375, height: 667 }, "mobile");
  console.log("Done. Output:", OUT);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
