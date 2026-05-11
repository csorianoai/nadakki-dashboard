// audit-screenshots.js
// Playwright script - captura baseline de las 9 rutas del dashboard
// + el prototipo standalone para comparacion visual
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
const ROUTES = [
  { url: '/credit-hub',                          name: 'credit-hub-home' },
  { url: '/credit-hub/dealer',                   name: 'dealer-panel' },
  { url: '/credit-hub/dealer/applications',      name: 'dealer-applications' },
  { url: '/credit-hub/dealer/applications/new',  name: 'dealer-new-application' },
  { url: '/credit-hub/bank',                     name: 'bank-panel' },
  { url: '/credit-hub/bank/applications',        name: 'bank-applications' },
  { url: '/credit-hub/bank/analytics',           name: 'bank-analytics' },
  { url: '/credit-hub/bank/compliance',          name: 'bank-compliance' },
  { url: '/credit-hub/bank/audit',               name: 'bank-audit' },
];
const OUTPUT_DIR = path.join(__dirname, 'screenshots', 'baseline');
const BASE_URL = 'http://127.0.0.1:3000';
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}
(async () => {
  console.log('Starting Playwright baseline screenshot capture...');
  console.log('Output: ' + OUTPUT_DIR + '\n');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
  });
  const page = await context.newPage();
  let captured = 0;
  let failed = 0;
  const failures = [];
  for (const route of ROUTES) {
    const fullUrl = BASE_URL + route.url;
    const filename = 'baseline_' + route.name + '.png';
    const filepath = path.join(OUTPUT_DIR, filename);
    try {
      console.log('Capturing ' + route.url + '...');
      const response = await page.goto(fullUrl, {
        waitUntil: 'networkidle',
        timeout: 15000,
      });
      if (response && response.status() >= 400) {
        throw new Error('HTTP ' + response.status());
      }
      await page.waitForTimeout(1500);
      await page.screenshot({
        path: filepath,
        fullPage: true,
      });
      const stats = fs.statSync(filepath);
      console.log('  -> ' + filename + ' OK (' + (stats.size / 1024).toFixed(1) + ' KB)');
      captured++;
    } catch (err) {
      console.error('  -> ERROR: ' + err.message);
      failures.push({ route: route.url, error: err.message });
      failed++;
    }
  }
  const standalonePath = path.join(
    __dirname,
    '..',
    'forge-design-preview',
    'Forge Credit Hub - Navy Inverso Light (standalone).html'
  );
  if (fs.existsSync(standalonePath)) {
    console.log('\nCapturing prototype standalone...');
    try {
      await page.goto('file://' + standalonePath, {
        waitUntil: 'networkidle',
        timeout: 15000,
      });
      await page.waitForTimeout(2500);
      await page.screenshot({
        path: path.join(OUTPUT_DIR, 'prototype-light.png'),
        fullPage: true,
      });
      console.log('  -> prototype-light.png OK');
      captured++;
    } catch (err) {
      console.error('  -> ERROR capturing prototype: ' + err.message);
      failures.push({ route: 'prototype-standalone', error: err.message });
      failed++;
    }
  } else {
    console.log('\nProto file not found, skipping.');
  }
  await browser.close();
  console.log('\n' + '='.repeat(60));
  console.log('SUMMARY');
  console.log('='.repeat(60));
  console.log('Captured: ' + captured);
  console.log('Failed:   ' + failed);
  if (failures.length > 0) {
    console.log('\nFailures:');
    failures.forEach(function(f) { console.log('  - ' + f.route + ': ' + f.error); });
  }
  console.log('\nOutput directory: ' + OUTPUT_DIR);
})();
