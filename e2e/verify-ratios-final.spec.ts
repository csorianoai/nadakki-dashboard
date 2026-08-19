import { test, expect } from '@playwright/test';

const FRONTEND = 'https://dashboard.nadakki.com';
const BACKEND = 'https://api.nadakki.com';
const APPLICATION_ID = 'edd8bc26-9c00-4467-9cfa-737698dfa47e';

test('verify ratios and co-firmante in production', async ({ page }) => {
  test.setTimeout(120000); // 2 minutes

  console.log('🔍 Verificación final en producción\n');

  // Step 1: Login via API
  console.log('1. Login via API...');
  const loginRes = await fetch(`${BACKEND}/api/v2/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'analista@test-piloto-02.com',
      password: 'TestPiloto2026!Seguro',
    }),
  });
  const loginData = await loginRes.json();
  const token = loginData.token || loginData.access_token;
  console.log('✓ Token obtenido\n');

  // Step 2: Inject token and navigate
  console.log('2. Navegando a aplicación...');
  await page.goto(FRONTEND);
  await page.evaluate((tk) => {
    localStorage.setItem('nadakki_sic_token', tk);
  }, token);
  
  await page.goto(`${FRONTEND}/credit-hub/bank/applications/${APPLICATION_ID}`, { 
    waitUntil: 'domcontentloaded',
    timeout: 60000 
  });
  
  // Wait for content to load
  await page.waitForTimeout(5000);
  console.log('✓ Aplicación cargada\n');

  // Step 3: Check PTI, DTI, LTV
  console.log('3. Verificando ratios...');
  const dtiLabel = await page.textContent('text=Deuda / Ingreso').catch(() => null);
  console.log(`  DTI label: ${dtiLabel ? '✅ Presente' : '❌ No encontrado'}`);
  
  const ptiLabel = await page.textContent('text=Cuota / Ingreso').catch(() => null);
  console.log(`  PTI label: ${ptiLabel ? '✅ Presente' : '❌ No encontrado'}`);
  
  const ltvLabel = await page.textContent('text=Préstamo / Valor').catch(() => null);
  console.log(`  LTV label: ${ltvLabel ? '✅ Presente' : '❌ No encontrado'}`);
  
  // Check for "No calculado" fallback (should not appear if backend sends data)
  const noCalculado = await page.textContent('text=No calculado').catch(() => null);
  console.log(`  "No calculado" fallback: ${noCalculado ? '❌ PRESENTE (no debería)' : '✅ No presente'}`);
  
  // Step 4: Check co-firmante
  console.log('\n4. Verificando co-firmante...');
  const coFirmanteSection = await page.textContent('text=Co-firmante / Garante').catch(() => null);
  console.log(`  Sección: ${coFirmanteSection ? '✅ Presente' : '❌ No encontrado'}`);
  
  const falseNote = await page.textContent('text=aún no están disponibles en el backend').catch(() => null);
  console.log(`  Nota falsa: ${falseNote ? '❌ PRESENTE (debería estar eliminada)' : '✅ Eliminada'}`);

  // Step 5: Check referencias
  console.log('\n5. Verificando referencias personales...');
  const refSection = await page.textContent('text=Referencias personales').catch(() => null);
  console.log(`  Sección: ${refSection ? '✅ Presente' : '❌ No encontrado'}`);

  // Step 6: Screenshot
  await page.screenshot({ path: 'verification-final.png', fullPage: true });
  console.log('\n✅ Screenshot guardado: verification-final.png');
  
  console.log('\n📋 Si los labels están presentes pero no ves los valores numéricos,');
  console.log('   revisa el screenshot para verificar visualmente.');
});
