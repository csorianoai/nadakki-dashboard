#!/usr/bin/env node
// ============================================================================
// tools/frontend_nav_check.mjs — Playwright navigation checker for Nadakki Dashboard
// ============================================================================
//
// Usage:
//   node tools/frontend_nav_check.mjs [BASE_URL]
//
// Environment variables:
//   BASE_URL    — Dashboard URL (default: https://dashboard.nadakki.com)
//   REPORT_PATH — JSON report output (default: tools/frontend_nav_check_report.json)
//   HEADLESS    — "true" (default) or "false"
//   TIMEOUT_MS  — Navigation timeout in ms (default: 20000)
//
// Exit codes:
//   0 — All checks passed
//   1 — One or more checks failed
//   2 — Fatal error (browser launch failure, etc.)
// ============================================================================

import { chromium } from 'playwright';
import { writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ── Configuration ──────────────────────────────────────────────────────────

const BASE_URL = process.argv[2] || process.env.BASE_URL || 'https://dashboard.nadakki.com';
const REPORT_PATH = process.env.REPORT_PATH || resolve(__dirname, 'frontend_nav_check_report.json');
const HEADLESS = (process.env.HEADLESS || 'true') !== 'false';
const TIMEOUT_MS = parseInt(process.env.TIMEOUT_MS || '20000', 10);

// ── Route availability checks (Level 1) ────────────────────────────────────

const ROUTE_CHECKS = [
  { path: '/marketing/onboarding', label: 'Marketing Onboarding' },
  { path: '/marketing/whatsapp',   label: 'Marketing WhatsApp' },
  { path: '/marketing/booking',    label: 'Marketing Booking' },
  { path: '/admin/audit',          label: 'Admin Audit' },
  { path: '/admin/readiness',      label: 'Admin Readiness' },
];

// ── Navigation link checks (Level 2) ───────────────────────────────────────
// Navigate to a page, verify <a href="..."> links exist in the sidebar/layout.
// Next.js <Link> renders as <a> in the browser DOM.

const NAV_CHECKS = [
  {
    page: '/admin',
    label: 'Admin Hub',
    expectedLinks: [
      { href: '/admin/audit',     label: 'Audit link' },
      { href: '/admin/readiness', label: 'Readiness link' },
    ],
  },
  {
    page: '/marketing',
    label: 'Marketing Hub',
    expectedLinks: [
      { href: '/marketing/onboarding', label: 'Onboarding link' },
      { href: '/marketing/whatsapp',   label: 'WhatsApp link' },
      { href: '/marketing/booking',    label: 'Booking link' },
    ],
  },
];

// ── Helpers ─────────────────────────────────────────────────────────────────

function log(icon, msg) {
  const ts = new Date().toISOString().slice(11, 19);
  console.log('[' + ts + '] ' + icon + ' ' + msg);
}

// ── Main ────────────────────────────────────────────────────────────────────

async function main() {
  const results = { routes: [], navigation: [], summary: {} };
  let browser = null;
  let pass = 0;
  let fail = 0;

  log('CONFIG', 'Base URL: ' + BASE_URL);
  log('CONFIG', 'Headless: ' + HEADLESS);
  log('CONFIG', 'Timeout: ' + TIMEOUT_MS + 'ms');
  console.log('');

  // ── Launch browser ────────────────────────────────────────────────────
  // On Windows with Application Control / WDAC / AppLocker policies,
  // Playwright's bundled chromium binaries may be blocked ("spawn UNKNOWN").
  // Strategy: try channels in order of reliability:
  //   1. msedge — system-installed Edge (always allowed by policy)
  //   2. chrome — system-installed Chrome (if present)
  //   3. default — Playwright bundled Chromium (may be blocked)
  const launchArgs = [
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-dev-shm-usage',
    '--disable-gpu',
  ];

  const channels = ['msedge', 'chrome', undefined];
  let launchError = null;

  for (const channel of channels) {
    try {
      const opts = {
        headless: HEADLESS,
        args: launchArgs,
        timeout: 30000,
      };
      if (channel) opts.channel = channel;
      browser = await chromium.launch(opts);
      log('OK', 'Browser launched' + (channel ? ' (channel: ' + channel + ')' : ' (bundled chromium)'));
      launchError = null;
      break;
    } catch (err) {
      launchError = err;
      log('WARN', 'Channel ' + (channel || 'default') + ' failed: ' + err.message.split('\n')[0]);
    }
  }

  try {
    if (launchError) throw launchError;
  } catch (err) {
    log('FATAL', 'Playwright browser launch FAILED: ' + err.message);
    log('HINT', 'Run: npx playwright install chromium');
    const report = {
      timestamp: new Date().toISOString(),
      baseUrl: BASE_URL,
      fatal: 'Browser launch failed: ' + err.message,
      routes: [],
      navigation: [],
      summary: { pass: 0, fail: 0, total: 0, result: 'ERROR' },
    };
    writeFileSync(REPORT_PATH, JSON.stringify(report, null, 2), 'utf-8');
    process.exit(2);
  }

  const context = await browser.newContext({ ignoreHTTPSErrors: true });
  const page = await context.newPage();
  page.setDefaultTimeout(TIMEOUT_MS);

  // ── Authenticate ──────────────────────────────────────────────────────
  // The dashboard requires login (localStorage-based demo auth).
  // Navigate to /login, fill credentials, submit, and wait for redirect.
  console.log('=== AUTHENTICATION ===');
  try {
    await page.goto(BASE_URL + '/login', { waitUntil: 'networkidle', timeout: TIMEOUT_MS });

    // Set localStorage auth directly (faster and more reliable than filling form)
    await page.evaluate(function() {
      localStorage.setItem('nadakki_auth', 'true');
      localStorage.setItem('nadakki_tenant_id', 'sf-rentals-nadaki-excursions');
      localStorage.setItem('nadakki_tenant_name', 'SF Rentals Nadaki Excursions');
      localStorage.setItem('nadakki_role', 'admin');
      localStorage.setItem('nadakki_plan', 'enterprise');
    });
    log('OK', 'Auth credentials set via localStorage');

    // Reload to pick up auth state
    await page.goto(BASE_URL + '/admin', { waitUntil: 'networkidle', timeout: TIMEOUT_MS });

    // Verify we are not on the login page
    const url = page.url();
    if (url.includes('/login')) {
      log('WARN', 'Still on login page after auth — trying form login');
      await page.goto(BASE_URL + '/login', { waitUntil: 'networkidle', timeout: TIMEOUT_MS });
      await page.fill('input[type="email"], input[name="email"], input[placeholder*="mail"]', 'admin@sfrentals.com');
      await page.fill('input[type="password"], input[name="password"]', 'admin123');
      await page.click('button[type="submit"], button:has-text("Iniciar")');
      await page.waitForTimeout(3000);
    }
    log('OK', 'Authenticated — current URL: ' + page.url());
  } catch (err) {
    log('WARN', 'Auth step failed: ' + err.message + ' — continuing anyway');
  }

  console.log('');

  // ── Level 1: Route availability ───────────────────────────────────────
  console.log('=== LEVEL 1: Route Availability ===');

  for (const route of ROUTE_CHECKS) {
    const url = BASE_URL + route.path;
    try {
      const resp = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: TIMEOUT_MS });
      const status = resp ? resp.status() : 0;
      const ok = status >= 200 && status < 400;
      if (ok) {
        log('PASS', route.label + ' (' + route.path + ') -> ' + status);
        pass++;
      } else {
        log('FAIL', route.label + ' (' + route.path + ') -> ' + status);
        fail++;
      }
      results.routes.push({ path: route.path, label: route.label, status, ok });
    } catch (err) {
      log('FAIL', route.label + ' (' + route.path + ') -> ' + err.message);
      fail++;
      results.routes.push({ path: route.path, label: route.label, status: 0, ok: false, error: err.message });
    }
  }

  console.log('');

  // ── Level 2: Navigation link checks ───────────────────────────────────
  console.log('=== LEVEL 2: Navigation Link Checks ===');

  for (const check of NAV_CHECKS) {
    const pageUrl = BASE_URL + check.page;
    log('NAV', 'Navigating to ' + check.label + ' (' + check.page + ')');

    try {
      const resp = await page.goto(pageUrl, { waitUntil: 'networkidle', timeout: TIMEOUT_MS });
      const pageStatus = resp ? resp.status() : 0;
      if (pageStatus < 200 || pageStatus >= 400) {
        log('FAIL', 'Could not load ' + check.page + ' (status ' + pageStatus + ')');
        fail += check.expectedLinks.length;
        results.navigation.push({
          page: check.page,
          label: check.label,
          loaded: false,
          pageStatus,
          links: check.expectedLinks.map(function(l) { return { href: l.href, label: l.label, found: false }; }),
        });
        continue;
      }

      const navResult = { page: check.page, label: check.label, loaded: true, pageStatus, links: [] };

      for (const link of check.expectedLinks) {
        // Build CSS selector safely — no template literals to avoid PS interpolation
        // Next.js Link renders <a> tags; href may be exact or have trailing slash
        const selectorExact = 'a[href="' + link.href + '"]';
        const selectorTrailing = 'a[href="' + link.href + '/"]';
        const selectorContains = 'a[href*="' + link.href + '"]';

        let found = await page.locator(selectorExact).count();
        if (found === 0) found = await page.locator(selectorTrailing).count();
        if (found === 0) found = await page.locator(selectorContains).count();

        if (found > 0) {
          log('PASS', 'Found link to ' + link.href + ' (' + link.label + ')');
          pass++;
          navResult.links.push({ href: link.href, label: link.label, found: true });
        } else {
          log('FAIL', 'Missing link to ' + link.href + ' (' + link.label + ')');
          fail++;
          navResult.links.push({ href: link.href, label: link.label, found: false });
        }
      }

      results.navigation.push(navResult);
    } catch (err) {
      log('FAIL', 'Error checking ' + check.page + ': ' + err.message);
      fail += check.expectedLinks.length;
      results.navigation.push({
        page: check.page,
        label: check.label,
        loaded: false,
        error: err.message,
        links: check.expectedLinks.map(function(l) { return { href: l.href, label: l.label, found: false }; }),
      });
    }
  }

  // ── Cleanup ───────────────────────────────────────────────────────────
  await context.close();
  await browser.close();

  // ── Summary ───────────────────────────────────────────────────────────
  const total = pass + fail;
  const resultStr = fail === 0 ? 'ALL PASSED' : 'FAILURES DETECTED';
  results.summary = { pass, fail, total, result: resultStr };

  console.log('');
  console.log('=== SUMMARY ===');
  log(fail === 0 ? 'PASS' : 'FAIL', resultStr + ': ' + pass + ' passed, ' + fail + ' failed out of ' + total + ' checks');

  // ── Write report ──────────────────────────────────────────────────────
  const report = {
    timestamp: new Date().toISOString(),
    baseUrl: BASE_URL,
    routes: results.routes,
    navigation: results.navigation,
    summary: results.summary,
  };

  try {
    writeFileSync(REPORT_PATH, JSON.stringify(report, null, 2), 'utf-8');
    log('REPORT', 'Written to ' + REPORT_PATH);
  } catch (err) {
    log('WARN', 'Failed to write report: ' + err.message);
  }

  // ── Exit code ─────────────────────────────────────────────────────────
  process.exit(fail > 0 ? 1 : 0);
}

main().catch(function(err) {
  log('FATAL', 'Unhandled error: ' + err.message);
  process.exit(2);
});
