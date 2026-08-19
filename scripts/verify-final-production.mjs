// Verificación final contra producción
import { chromium } from 'playwright';

const PROD = 'https://dashboard.nadakki.com';
const APP_ID = 'edd8bc26-9c00-4467-9cfa-737698dfa47e';

(async () => {
  console.log('🔍 Verificando PTI/DTI/LTV ratios y co-firmante/referencias en producción...\n');

  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  // Login
  await page.goto(`${PROD}/login`);
  await page.fill('input[type="email"]', 'analista@test-piloto-02.com');
  await page.fill('input[type="password"]', 'TestPiloto2026!Seguro');
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/(credit-hub|bank)/, { timeout: 15000 });

  // Navigate to application
  await page.goto(`${PROD}/credit-hub/bank/applications/${APP_ID}`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(3000);

  // Check PTI, DTI, LTV values
  const ratios = {
    dti: null,
    pti: null,
    ltv: null,
  };

  const dtiText = await page.textContent('text=/Deuda.*Ingreso/').catch(() => null);
  const dtiValueEl = dtiText ? await page.locator('text=/Deuda.*Ingreso/').locator('xpath=following-sibling::*[1]').textContent().catch(() => null) : null;
  ratios.dti = dtiValueEl;
  console.log(`DTI (Deuda / Ingreso): ${ratios.dti}`);

  const ptiText = await page.textContent('text=/Cuota.*Ingreso/').catch(() => null);
  const ptiValueEl = ptiText ? await page.locator('text=/Cuota.*Ingreso/').locator('xpath=following-sibling::*[1]').textContent().catch(() => null) : null;
  ratios.pti = ptiValueEl;
  console.log(`PTI (Cuota / Ingreso): ${ratios.pti}`);

  const ltvText = await page.textContent('text=/Préstamo.*Valor/').catch(() => null);
  const ltvValueEl = ltvText ? await page.locator('text=/Préstamo.*Valor/').locator('xpath=following-sibling::*[1]').textContent().catch(() => null) : null;
  ratios.ltv = ltvValueEl;
  console.log(`LTV (Préstamo / Valor): ${ratios.ltv}`);

  // Check co-firmante
  const coFirmanteNombre = await page.textContent('text=/Co-firmante.*Garante/ >> xpath=../..//div[contains(text(),"Nombre")]/following-sibling::div').catch(() => null);
  const coFirmanteCedula = await page.textContent('text=/Co-firmante.*Garante/ >> xpath=../..//div[contains(text(),"Cédula")]/following-sibling::div').catch(() => null);
  const coFirmanteIngreso = await page.textContent('text=/Co-firmante.*Garante/ >> xpath=../..//div[contains(text(),"Ingreso")]/following-sibling::div').catch(() => null);
  const coFirmanteTelefono = await page.textContent('text=/Co-firmante.*Garante/ >> xpath=../..//div[contains(text(),"Teléfono")]/following-sibling::div').catch(() => null);
  const coFirmanteRelacion = await page.textContent('text=/Co-firmante.*Garante/ >> xpath=../..//div[contains(text(),"Relación")]/following-sibling::div').catch(() => null);

  console.log(`\nCo-firmante:`);
  console.log(`  Nombre: ${coFirmanteNombre}`);
  console.log(`  Cédula: ${coFirmanteCedula}`);
  console.log(`  Ingreso: ${coFirmanteIngreso}`);
  console.log(`  Teléfono: ${coFirmanteTelefono}`);
  console.log(`  Relación: ${coFirmanteRelacion}`);

  // Check referencias
  const refSection = await page.textContent('text=/Referencias personales/').catch(() => null);
  const refCount = refSection ? await page.locator('text=/Referencias personales/ >> xpath=../..').locator('.ch-card').count() : 0;
  console.log(`\nReferencias personales: ${refCount} encontradas`);

  if (refCount > 0) {
    for (let i = 0; i < Math.min(refCount, 3); i++) {
      const card = page.locator('.ch-card').nth(i);
      const nombre = await card.locator('div:has-text("Nombre") ~ div').textContent().catch(() => 'N/A');
      const relacion = await card.locator('div:has-text("Relación") ~ div').textContent().catch(() => 'N/A');
      const telefono = await card.locator('div:has-text("Teléfono") ~ div').textContent().catch(() => 'N/A');
      console.log(`  ${i + 1}. ${nombre} · ${relacion} · ${telefono}`);
    }
  }

  // Screenshot
  await page.screenshot({ path: 'verification-final-production.png', fullPage: true });
  console.log('\n✅ Screenshot guardado: verification-final-production.png');

  // Verify expectations
  console.log('\n📊 VERIFICACIÓN:');
  const checks = {
    'DTI con porcentaje y decimal': /\d+\.\d+%/.test(ratios.dti || ''),
    'PTI con porcentaje y decimal': /\d+\.\d+%/.test(ratios.pti || ''),
    'LTV con porcentaje y decimal': /\d+\.\d+%/.test(ratios.ltv || ''),
    'Co-firmante nombre presente': !!coFirmanteNombre && coFirmanteNombre !== 'No informado',
    'Co-firmante teléfono presente': !!coFirmanteTelefono && coFirmanteTelefono !== 'No informado',
    'Co-firmante relación presente': !!coFirmanteRelacion && coFirmanteRelacion !== 'No informado',
    'Al menos 1 referencia': refCount > 0,
  };

  for (const [check, pass] of Object.entries(checks)) {
    console.log(`  ${pass ? '✅' : '❌'} ${check}`);
  }

  await browser.close();
})();
