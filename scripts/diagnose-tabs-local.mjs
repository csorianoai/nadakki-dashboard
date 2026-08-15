/**
 * Diagnostic script to capture console logs from Stipulations and Audit tabs
 * running local frontend against production backend.
 */

import { chromium } from '@playwright/test';

const BANK_EMAIL = 'analista@test-piloto-02.com';
const BANK_PASSWORD = 'TestPiloto2026!Seguro';
const APPLICATION_ID = '6a68b243-567b-493d-9b7d-68fd048eb62d';
const LOCAL_URL = 'http://localhost:3000';

async function main() {
  console.log('[DIAGNOSTIC] Starting browser...');
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  const consoleLogs = [];
  page.on('console', (msg) => {
    const text = msg.text();
    if (text.includes('[StipulationsTab]') || text.includes('[getStipulations]') || 
        text.includes('[AuditTab]') || text.includes('[getAuditTrail]') || 
        text.includes('[useBankAuditTrail]')) {
      consoleLogs.push({
        type: msg.type(),
        text: text,
        timestamp: new Date().toISOString(),
      });
      console.log(`[CONSOLE ${msg.type()}]`, text);
    }
  });

  try {
    console.log('[DIAGNOSTIC] Navigating to login...');
    await page.goto(`${LOCAL_URL}/auth/login`);
    await page.waitForLoadState('networkidle');

    console.log('[DIAGNOSTIC] Filling login form...');
    await page.fill('input[type="email"], input[name="email"]', BANK_EMAIL);
    await page.fill('input[type="password"], input[name="password"]', BANK_PASSWORD);
    
    console.log('[DIAGNOSTIC] Submitting login...');
    await page.click('button[type="submit"]');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    console.log('[DIAGNOSTIC] Navigating to application detail...');
    const detailUrl = `${LOCAL_URL}/credit-hub/bank/applications/${APPLICATION_ID}`;
    await page.goto(detailUrl);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    console.log('[DIAGNOSTIC] Clicking Stipulations tab...');
    const stipulationsTab = page.locator('text=/Estipulaciones/i').first();
    if (await stipulationsTab.isVisible()) {
      await stipulationsTab.click();
      await page.waitForTimeout(3000);
      console.log('[DIAGNOSTIC] Stipulations tab clicked, waiting for logs...');
    } else {
      console.log('[DIAGNOSTIC] Stipulations tab not found!');
    }

    console.log('[DIAGNOSTIC] Clicking Audit tab...');
    const auditTab = page.locator('text=/Auditor[ií]a/i').first();
    if (await auditTab.isVisible()) {
      await auditTab.click();
      await page.waitForTimeout(3000);
      console.log('[DIAGNOSTIC] Audit tab clicked, waiting for logs...');
    } else {
      console.log('[DIAGNOSTIC] Audit tab not found!');
    }

    console.log('\n' + '='.repeat(80));
    console.log('CAPTURED CONSOLE LOGS:');
    console.log('='.repeat(80));
    consoleLogs.forEach((log, i) => {
      console.log(`\n[${i + 1}] ${log.timestamp} [${log.type}]`);
      console.log(log.text);
    });
    console.log('='.repeat(80) + '\n');

    console.log('[DIAGNOSTIC] Keeping browser open for manual inspection. Press Ctrl+C to close.');
    await page.waitForTimeout(120000);

  } catch (error) {
    console.error('[DIAGNOSTIC ERROR]', error);
  } finally {
    await browser.close();
  }
}

main().catch(console.error);
