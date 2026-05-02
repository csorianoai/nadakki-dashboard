/**
 * Capture 9 hero Credit Hub pages (desktop + mobile), reusing Phase 6 reusability-test PNGs when available.
 * Writes tools/docs/_capture-report.json
 */
import { chromium } from "playwright";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..", "..");
const OUT = path.join(ROOT, "app", "(forge)", "credit-hub", "_design", "_assets", "pages");
const REUSE = path.join(ROOT, "app", "(forge)", "credit-hub", "_design", "_inventory", "reusability-test");
const BASE = process.env.BASE_URL || "http://127.0.0.1:3000";
const REPORT = path.join(__dirname, "_capture-report.json");

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const PAGES = [
  { id: "dashboard", url: "/credit-hub/bank", persona: "bank", reuseDesktop: "bank-dashboard.png", reuseMobile: "bank-dashboard.png" },
  { id: "applications-list", url: "/credit-hub/bank/applications", persona: "bank", reuseDesktop: "bank-applications-list.png", reuseMobile: "bank-applications-list.png" },
  { id: "application-detail", url: "/credit-hub/bank/applications/APP-1847", persona: "bank", reuseDesktop: "bank-application-detail.png", reuseMobile: "bank-application-detail.png" },
  { id: "audit", url: "/credit-hub/bank/audit", persona: "bank", reuseDesktop: "bank-audit.png", reuseMobile: "bank-audit.png" },
  { id: "compliance", url: "/credit-hub/bank/compliance", persona: "bank", reuseDesktop: "bank-compliance.png", reuseMobile: "bank-compliance.png" },
  { id: "dashboard", url: "/credit-hub/dealer", persona: "dealer", reuseDesktop: "dealer-dashboard.png", reuseMobile: "dealer-dashboard.png" },
  { id: "applications-list", url: "/credit-hub/dealer/applications", persona: "dealer", reuseDesktop: "dealer-applications-list.png", reuseMobile: "dealer-applications-list.png" },
  { id: "application-detail", url: "/credit-hub/dealer/applications/APP-1847", persona: "dealer", reuseDesktop: "dealer-applications-detail.png", reuseMobile: "dealer-applications-detail.png" },
  { id: "wizard-step1", url: "/credit-hub/dealer/applications/new/applicant", persona: "dealer", reuseDesktop: "dealer-applications-new-step1.png", reuseMobile: "dealer-applications-new-step1.png" },
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
    throw new Error(`Cannot reach ${u.href} (${e.message}).`);
  }
}

function copyReuse(subdir, file, dest) {
  const src = path.join(REUSE, subdir, file);
  if (!fs.existsSync(src)) return false;
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(src, dest);
  return true;
}

async function main() {
  await checkHealth();
  fs.mkdirSync(OUT, { recursive: true });
  const events = [];

  for (const shot of PAGES) {
    const dir = path.join(OUT, shot.persona);
    for (const [suffix, reuseSub, reuseFile] of [
      ["desktop", "desktop", shot.reuseDesktop],
      ["mobile", "mobile", shot.reuseMobile],
    ]) {
      const dest = path.join(dir, `${shot.id}-${suffix}.png`);
      if (copyReuse(reuseSub, reuseFile, dest)) {
        events.push({ persona: shot.persona, id: shot.id, suffix, mode: "reused", from: `reusability-test/${reuseSub}/${reuseFile}` });
        console.log("REUSE", shot.persona, shot.id, suffix);
      }
    }
  }

  const browser = await launchBrowser();
  for (const shot of PAGES) {
    const dir = path.join(OUT, shot.persona);
    for (const [suffix, vw, vh] of [
      ["desktop", 1280, 800],
      ["mobile", 375, 667],
    ]) {
      const dest = path.join(dir, `${shot.id}-${suffix}.png`);
      if (fs.existsSync(dest) && fs.statSync(dest).size > 500) continue;

      const context = await browser.newContext({ viewport: { width: vw, height: vh } });
      const page = await context.newPage();
      try {
        await page.goto(`${BASE}${shot.url}`, { waitUntil: "domcontentloaded", timeout: 90_000 });
        await sleep(900);
        await page.screenshot({ path: dest, fullPage: false });
        events.push({ persona: shot.persona, id: shot.id, suffix, mode: "captured", url: `${BASE}${shot.url}` });
        console.log("CAPTURE", shot.persona, shot.id, suffix);
      } finally {
        await context.close();
      }
    }
  }
  await browser.close();

  let componentsBlock = null;
  if (fs.existsSync(REPORT)) {
    try {
      const prev = JSON.parse(fs.readFileSync(REPORT, "utf8"));
      if (prev.components) componentsBlock = prev.components;
      else if (prev.findings != null || prev.captures != null) {
        componentsBlock = {
          findings: prev.findings ?? [],
          countsByPrimitive: prev.countsByPrimitive ?? {},
          captures: prev.captures ?? [],
        };
      }
    } catch {
      /* ignore */
    }
  }

  const pageReport = {
    reused: events.filter((e) => e.mode === "reused").length,
    captured: events.filter((e) => e.mode === "captured").length,
    events,
  };
  const report = {
    generatedAt: new Date().toISOString(),
    ...(componentsBlock ? { components: componentsBlock } : {}),
    pages: pageReport,
  };
  fs.writeFileSync(REPORT, JSON.stringify(report, null, 2), "utf8");
  console.log("capture-pages: Done →", OUT);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
