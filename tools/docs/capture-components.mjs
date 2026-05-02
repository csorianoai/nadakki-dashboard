/**
 * Capture Forge preview (/credit-hub/preview) for documentation assets.
 * Outputs under app/(forge)/credit-hub/_design/_assets/components/
 *
 * Requires: npm run build && npm run start
 * BASE_URL default http://127.0.0.1:3000
 */
import { chromium } from "playwright";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..", "..");
const OUT = path.join(ROOT, "app", "(forge)", "credit-hub", "_design", "_assets", "components");
const BASE = process.env.BASE_URL || "http://127.0.0.1:3000";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function launchBrowser() {
  try {
    return await chromium.launch({ channel: "msedge", headless: true });
  } catch (e) {
    console.warn("capture-components: msedge unavailable, using bundled Chromium:", e.message);
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

/** @param {import('playwright').Page} page */
async function shotLocator(page, locator, relPath) {
  const dest = path.join(OUT, relPath);
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  await locator.scrollIntoViewIfNeeded().catch(() => {});
  await sleep(200);
  await locator.screenshot({ path: dest });
  console.log("OK", relPath);
}

/** @param {import('playwright').Page} page */
function sectionByTitle(page, title) {
  return page.getByRole("heading", { name: title, exact: true, level: 2 }).locator("xpath=ancestor::section[1]");
}

async function main() {
  await checkHealth();
  fs.mkdirSync(OUT, { recursive: true });

  const expectedSections = [
    "Buttons & icon buttons",
    "Form controls",
    "Consent capture",
    "Cards, empty state, badges",
    "Skeleton & avatar",
    "Tabs",
    "Data table",
    "Evidence & audit",
    "Overlays & toast",
  ];
  const findings = [];

  const browser = await launchBrowser();
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await context.newPage();
  const previewUrl = `${BASE}/credit-hub/preview`;
  await page.goto(previewUrl, { waitUntil: "domcontentloaded", timeout: 90_000 });
  await sleep(800);

  for (const title of expectedSections) {
    try {
      await sectionByTitle(page, title).waitFor({ state: "visible", timeout: 5000 });
    } catch {
      findings.push({ type: "missing-preview-section", title });
      console.warn("MISSING preview section:", title);
    }
  }

  const captures = [];

  // Layout chrome (sidebar + topbar + KPI strip)
  const layoutChrome = page.locator("div.mx-auto.mt-8.max-w-6xl").first();
  await shotLocator(page, layoutChrome, "layout/sidebar-topbar-kpi.png");
  captures.push({ primitive: "layout", file: "layout/sidebar-topbar-kpi.png" });

  const h3Slugs = [
    ["Buttons & icon buttons", "Variants (default)", "button/variants-default.png", "Button"],
    ["Buttons & icon buttons", "Loading (leading spinner, label visible)", "button/variants-loading.png", "Button"],
    ["Buttons & icon buttons", "Disabled (no hover lift)", "button/variants-disabled.png", "Button"],
    ["Buttons & icon buttons", "IconButton", "button/iconbutton.png", "IconButton"],
    ["Buttons & icon buttons", "Focus on surfaces (Tab through — brand-500 ring)", "button/focus-surfaces.png", "Button"],
  ];
  for (const [section, h3, out, prim] of h3Slugs) {
    const sec = sectionByTitle(page, section);
    const h = sec.getByRole("heading", { name: h3, exact: true, level: 3 });
    const box = h.locator("xpath=ancestor::div[1]");
    await shotLocator(page, box, out);
    captures.push({ primitive: prim, file: out });
  }

  const sections = [
    ["Form controls", "form-controls/section.png", "Input"],
    ["Consent capture", "consent-capture/section.png", "ConsentCapture"],
    ["Cards, empty state, badges", "cards-badges-empty/section.png", "Card"],
    ["Skeleton & avatar", "skeleton-avatar/section.png", "Skeleton"],
    ["Tabs", "tabs/section.png", "Tabs"],
    ["Evidence & audit", "evidence-audit/section.png", "EvidenceCard"],
    ["Overlays & toast", "overlays/section.png", "Modal"],
  ];
  for (const [title, out, prim] of sections) {
    await shotLocator(page, sectionByTitle(page, title), out);
    captures.push({ primitive: prim, file: out });
  }

  // DataTable: density × preview mode (native selects from Forge Select)
  const tableSection = sectionByTitle(page, "Data table");
  const densities = ["comfortable", "compact", "dense"];
  const modes = [
    ["data", "With rows"],
    ["loading", "Loading skeleton"],
    ["empty", "Empty (EmptyState)"],
  ];
  for (const d of densities) {
    await page.locator('select[name="preview-table-density"]').selectOption(d);
    for (const [val, label] of modes) {
      await page.locator('select[name="preview-table-demo"]').selectOption({ label });
      await sleep(450);
      const fp = `datatable/density-${d}-mode-${val}.png`;
      await shotLocator(page, tableSection, fp);
      captures.push({ primitive: "DataTable", file: fp });
    }
  }

  // Sort states: reset to data + comfortable, click Applicant header twice for asc/desc
  await page.locator('select[name="preview-table-density"]').selectOption("comfortable");
  await page.locator('select[name="preview-table-demo"]').selectOption("data");
  await sleep(300);
  const applicantBtn = tableSection.getByRole("button", { name: /Applicant/i }).first();
  await applicantBtn.click();
  await sleep(250);
  await shotLocator(page, tableSection, "datatable/sorted-asc.png");
  captures.push({ primitive: "DataTable", file: "datatable/sorted-asc.png" });
  await applicantBtn.click();
  await sleep(250);
  await shotLocator(page, tableSection, "datatable/sorted-desc.png");
  captures.push({ primitive: "DataTable", file: "datatable/sorted-desc.png" });

  // Passive empty row block (second DataTable in section)
  await shotLocator(
    page,
    tableSection.getByText(/DataTable — empty row/).locator("xpath=following-sibling::*[1]"),
    "datatable/empty-success-tone.png"
  );
  captures.push({ primitive: "DataTable", file: "datatable/empty-success-tone.png" });

  // Bulk strip
  await shotLocator(
    page,
    tableSection.getByText(/Bulk action bar/).locator("xpath=ancestor::div[contains(@class,'rounded-forge-md')][1]"),
    "datatable/bulk-action-bar.png"
  );
  captures.push({ primitive: "DataTable", file: "datatable/bulk-action-bar.png" });

  // Command palette (opens cmd surface) — target preview button, not shell topbar duplicate label
  await sectionByTitle(page, "Overlays & toast")
    .getByRole("button", { name: "Open command palette" })
    .click();
  await sleep(500);
  const palette = page.getByRole("dialog", { name: "Command palette" });
  if ((await palette.count()) > 0) {
    await shotLocator(page, palette, "command-palette/open.png");
    captures.push({ primitive: "CommandPalette", file: "command-palette/open.png" });
  }
  await page.keyboard.press("Escape");
  await sleep(200);

  await context.close();
  await browser.close();

  const byPrim = {};
  for (const c of captures) {
    byPrim[c.primitive] = (byPrim[c.primitive] || 0) + 1;
  }
  const REPORT = path.join(__dirname, "_capture-report.json");
  let pagesBlock = null;
  if (fs.existsSync(REPORT)) {
    try {
      const prev = JSON.parse(fs.readFileSync(REPORT, "utf8"));
      if (prev.pages) pagesBlock = prev.pages;
    } catch {
      /* ignore */
    }
  }
  const out = {
    generatedAt: new Date().toISOString(),
    components: { findings, countsByPrimitive: byPrim, captures },
  };
  if (pagesBlock) out.pages = pagesBlock;
  fs.writeFileSync(REPORT, JSON.stringify(out, null, 2), "utf8");
  console.log("capture-components: Done →", OUT);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
