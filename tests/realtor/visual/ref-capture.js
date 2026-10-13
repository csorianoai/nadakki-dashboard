// Captura 1440×900 de un centro del prototipo DL10A. Uso: node ref-capture.js <html> <png> <indice-centro>
const { chromium } = require("@playwright/test");

(async () => {
  const [html, png, idx] = process.argv.slice(2);
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto("file://" + html);
  await page.locator(`[data-qa="nav-${idx}"]`).first().click();
  await page.waitForTimeout(800);
  await page.screenshot({ path: png });
  await browser.close();
})();
