import { test, expect } from '@playwright/test';

const FRONTEND = 'https://dashboard.nadakki.com';
const APPLICATION_ID = 'edd8bc26-9c00-4467-9cfa-737698dfa47e';

test('verify expediente displays all wizard data in production', async ({ page }) => {
  console.log('=== VERIFICACIÓN UI EN PRODUCCIÓN ===\n');

  // Capturar logs de consola para debug
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log('[BROWSER ERROR]', msg.text());
    }
  });

  // Step 1: Login
  console.log('1. Navegando a login...');
  await page.goto(`${FRONTEND}/login`);
  
  await page.fill('input[type="email"]', 'analista@test-piloto-02.com');
  await page.fill('input[type="password"]', 'TestPiloto2026!Seguro');
  await page.click('button[type="submit"]');
  
  // Esperar navegación post-login
  await page.waitForURL(/credit-hub\/bank/, { timeout: 15000 });
  console.log('✓ Login exitoso\n');

  // Step 2: Navegar a la aplicación específica
  console.log('2. Navegando a aplicación...');
  await page.goto(`${FRONTEND}/credit-hub/bank/applications/${APPLICATION_ID}`);
  await page.waitForLoadState('networkidle');
  console.log('✓ Aplicación cargada\n');

  // Step 3: Verificar que las secciones existen
  console.log('3. Verificando secciones renderizadas:\n');

  const sections = [
    { selector: 'text=Capacidad de pago', name: 'Capacidad de pago' },
    { selector: 'text=Cuota / Ingreso', name: 'Cuota / Ingreso (PTI)' },
    { selector: 'text=Deuda / Ingreso', name: 'Deuda / Ingreso (DTI)' },
    { selector: 'text=La operación', name: 'La operación' },
    { selector: 'text=Préstamo / Valor', name: 'Préstamo / Valor (LTV)' },
    { selector: 'text=Vehículo · Detalles completos', name: 'Vehículo' },
    { selector: 'text=Co-firmante / Garante', name: 'Co-firmante' },
  ];

  for (const section of sections) {
    const visible = await page.locator(section.selector).isVisible().catch(() => false);
    console.log(`  ${visible ? '✓' : '✗'} ${section.name}`);
    if (!visible) {
      console.log(`    [DEBUG] Selector: ${section.selector}`);
    }
  }

  // Step 4: Verificar valores específicos
  console.log('\n4. Verificando valores visibles:\n');

  const values = [
    { text: 'RD$75,000', name: 'Ingreso mensual' },
    { text: 'Empresa ABC S.A.', name: 'Empleador' },
    { text: 'Gerente de Ventas', name: 'Puesto' },
    { text: '5 años, 3 meses', name: 'Antigüedad' },
    { text: 'RD$15,000', name: 'Deudas vigentes' },
    { text: 'RD$3,500', name: 'Pago mensual deudas' },
    { text: 'RD$600,000', name: 'Monto solicitado' },
    { text: '60 meses', name: 'Plazo' },
    { text: 'RD$200,000', name: 'Enganche' },
    { text: 'Ahorros personales', name: 'Fuente enganche' },
    { text: 'Toyota', name: 'Marca' },
    { text: 'Corolla', name: 'Modelo' },
    { text: '2022', name: 'Año' },
    { text: '5TDJKRFH3NS123456', name: 'VIN' },
    { text: 'RD$1,200,000', name: 'Valuación' },
  ];

  const pageContent = await page.content();
  for (const value of values) {
    const visible = pageContent.includes(value.text);
    console.log(`  ${visible ? '✓' : '✗'} ${value.name}: ${value.text}`);
  }

  // Step 5: Screenshot para evidencia
  console.log('\n5. Capturando screenshot...');
  await page.screenshot({ 
    path: 'verification-expediente-production.png',
    fullPage: true 
  });
  console.log('✓ Screenshot guardado: verification-expediente-production.png\n');

  console.log('=== VERIFICACIÓN COMPLETADA ===');
});
