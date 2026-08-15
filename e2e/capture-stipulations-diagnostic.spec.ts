/**
 * Playwright diagnostic spec for Stipulations tab
 * Captures all console logs, network activity, and page errors
 * when clicking Stipulations tab in production.
 */

import { test, expect } from '@playwright/test';

const PROD_URL = 'https://dashboard.nadakki.com';
const EMAIL = 'analista@test-piloto-02.com';
const PASSWORD = 'TestPiloto2026!Seguro';
const APPLICATION_ID = '6a68b243-567b-493d-9b7d-68fd048eb62d';

test('capture stipulations diagnostic logs from production', async ({ page }) => {
  // Capture all console logs
  page.on('console', (msg) => {
    console.log('[BROWSER]', msg.text());
  });

  // Capture page errors
  page.on('pageerror', (error) => {
    console.log('[PAGEERROR]', error.toString());
  });

  // Capture failed requests
  page.on('requestfailed', (request) => {
    console.log('[REQFAILED]', request.url(), request.failure()?.errorText);
  });

  // Capture stipulations network responses
  page.on('response', async (response) => {
    if (response.url().includes('stipulations')) {
      console.log('[NET]', response.status(), response.url());
      try {
        const body = await response.text();
        console.log('[BODY]', body);
      } catch (e) {
        console.log('[BODY] Could not read body:', e.message);
      }
    }
  });

  console.log('='.repeat(80));
  console.log('STARTING DIAGNOSTIC CAPTURE - STIPULATIONS TAB');
  console.log('='.repeat(80));

  // Navigate to production login
  console.log('[TEST] Navigating to production login...');
  await page.goto(`${PROD_URL}/auth/login`, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('input[type="email"], input[name="email"]', { timeout: 10000 });

  // Fill login form
  console.log('[TEST] Filling login credentials...');
  await page.fill('input[type="email"], input[name="email"]', EMAIL);
  await page.fill('input[type="password"], input[name="password"]', PASSWORD);

  // Submit login
  console.log('[TEST] Submitting login...');
  await page.click('button[type="submit"]');
  
  // Wait for navigation away from login page
  console.log('[TEST] Waiting for login to complete...');
  try {
    await page.waitForURL(url => !url.includes('/login') && !url.includes('/auth'), { timeout: 15000 });
    console.log('[TEST] Login successful, now at:', page.url());
  } catch (e) {
    console.log('[TEST] Login did not redirect, still at:', page.url());
    await page.screenshot({ path: 'test-results/login-failed.png', fullPage: true });
    throw new Error('Login failed - did not redirect away from login page');
  }
  
  await page.waitForTimeout(2000);

  // Navigate to application detail
  console.log('[TEST] Navigating to application detail...');
  const cacheBuster = Date.now();
  const detailUrl = `${PROD_URL}/credit-hub/bank/applications/${APPLICATION_ID}?__v=${cacheBuster}`;
  await page.goto(detailUrl, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(5000);

  // Take screenshot before clicking
  await page.screenshot({ path: 'test-results/before-click.png', fullPage: true });
  console.log('[TEST] Screenshot saved: before-click.png');

  // Click Stipulations tab - try multiple selectors
  console.log('[TEST] Clicking Stipulations tab...');
  const stipulationsSelectors = [
    'button:has-text("Estipulaciones")',
    'button:has-text("estipulaciones")',
    '[role="tab"]:has-text("Estipulaciones")',
    'text=/Estipulaciones/i',
  ];
  
  let clicked = false;
  for (const selector of stipulationsSelectors) {
    try {
      const element = page.locator(selector).first();
      if (await element.isVisible({ timeout: 2000 })) {
        await element.click();
        clicked = true;
        console.log(`[TEST] Clicked using selector: ${selector}`);
        break;
      }
    } catch (e) {
      console.log(`[TEST] Selector failed: ${selector}`);
    }
  }
  
  if (!clicked) {
    await page.screenshot({ path: 'test-results/selector-failed.png', fullPage: true });
    console.log('[TEST] ERROR: Could not find Stipulations tab');
    console.log('[TEST] Page URL:', page.url());
    console.log('[TEST] Page title:', await page.title());
    throw new Error('Stipulations tab not found');
  }
  
  // Wait for 3 seconds
  console.log('[TEST] Waiting 3 seconds for data to load...');
  await page.waitForTimeout(3000);

  // Capture visible text in the panel
  console.log('[TEST] Capturing visible panel text...');
  const panelText = await page.locator('[data-testid="credit-hub-stipulations-list"], .ch-card, .ch-panel').first().textContent();
  console.log('[PANEL_TEXT]', panelText?.trim() || 'No panel text found');

  console.log('='.repeat(80));
  console.log('DIAGNOSTIC CAPTURE COMPLETE');
  console.log('='.repeat(80));
});
