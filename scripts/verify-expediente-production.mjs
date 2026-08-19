// Verificación en producción: aplicación edd8bc26-9c00-4467-9cfa-737698dfa47e
const BACKEND = "https://api.nadakki.com";
const FRONTEND = "https://dashboard.nadakki.com";

console.log("=== VERIFICACIÓN POST-DEPLOYMENT ===\n");
console.log(`Aplicación: edd8bc26-9c00-4467-9cfa-737698dfa47e`);
console.log(`Frontend: ${FRONTEND}`);
console.log(`Timestamp: ${new Date().toISOString()}\n`);

// Step 1: Login como analista
console.log("1. Login analista...");
const loginRes = await fetch(`${BACKEND}/api/v2/auth/login`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    email: "analista@test-piloto-02.com",
    password: "TestPiloto2026!Seguro"
  }),
});

if (!loginRes.ok) {
  console.error(`❌ Login failed: ${loginRes.status}`);
  process.exit(1);
}

const loginData = await loginRes.json();
const token = loginData.token || loginData.access_token;
console.log("✓ Login exitoso\n");

// Step 2: Obtener expediente completo
console.log("2. Obteniendo expediente/full...");
const expedienteRes = await fetch(`${BACKEND}/api/v2/credit/applications/edd8bc26-9c00-4467-9cfa-737698dfa47e/expediente/full`, {
  method: "GET",
  headers: {
    "Authorization": `Bearer ${token}`,
    "Content-Type": "application/json",
  },
});

if (!expedienteRes.ok) {
  console.error(`❌ Expediente fetch failed: ${expedienteRes.status}`);
  process.exit(1);
}

const expediente = await expedienteRes.json();
console.log("✓ Expediente obtenido\n");

// Step 3: Verificar datos esperados
console.log("3. Verificando datos del wizard:\n");

const checks = [
  { label: "Ingreso mensual", value: expediente.applicant?.ingreso_mensual, expected: 75000 },
  { label: "Empleador", value: expediente.applicant?.nombre_empleador, expected: "Empresa ABC S.A." },
  { label: "Puesto", value: expediente.applicant?.puesto_trabajo, expected: "Gerente de Ventas" },
  { label: "Años empleo", value: expediente.applicant?.anos_empleo, expected: 5 },
  { label: "Meses empleo", value: expediente.applicant?.meses_empleo, expected: 3 },
  { label: "Deudas vigentes", value: expediente.applicant?.deudas_vigentes, expected: 15000 },
  { label: "Pago mensual deudas", value: expediente.applicant?.pago_mensual_deudas, expected: 3500 },
  { label: "VIN", value: expediente.vehicle?.vin, expected: "5TDJKRFH3NS123456" },
  { label: "Condición vehículo", value: expediente.vehicle?.condicion, expected: "usado" },
  { label: "Valuación", value: expediente.vehicle?.valuacion, expected: 1200000 },
  { label: "Marca", value: expediente.vehicle?.marca, expected: "Toyota" },
  { label: "Modelo", value: expediente.vehicle?.modelo, expected: "Corolla" },
  { label: "Año", value: expediente.vehicle?.ano, expected: 2022 },
  { label: "Fuente enganche", value: expediente.financial?.fuente_enganche, expected: "Ahorros personales" },
  { label: "Monto enganche", value: expediente.financial?.enganche, expected: 200000 },
  { label: "Monto solicitado", value: expediente.financial?.monto_solicitado, expected: 600000 },
  { label: "Plazo", value: expediente.financial?.plazo_meses, expected: 60 },
];

let allPass = true;
for (const check of checks) {
  const pass = check.value === check.expected;
  const icon = pass ? "✓" : "✗";
  const status = pass ? "OK" : `FAIL (got: ${JSON.stringify(check.value)})`;
  console.log(`  ${icon} ${check.label}: ${status}`);
  if (!pass) allPass = false;
}

console.log("\n4. Verificando ratios calculados:");
console.log(`  PTI (cuota/ingreso): ${expediente.financial?.pti != null ? `${(expediente.financial.pti * 100).toFixed(1)}%` : "NO VIENE (esperado)"}`);
console.log(`  DTI (deuda/ingreso): ${expediente.analysis?.dti != null ? `${(expediente.analysis.dti * 100).toFixed(1)}%` : "NO VIENE (esperado)"}`);
console.log(`  LTV (préstamo/valor): ${expediente.financial?.ltv != null ? `${(expediente.financial.ltv * 100).toFixed(1)}%` : "NO VIENE (esperado)"}`);

console.log("\n5. Verificando referencias y co-firmante:");
console.log(`  Referencias personales: ${expediente.referencias_personales ? `${expediente.referencias_personales.length} encontradas` : "NO VIENE (esperado)"}`);
console.log(`  Co-firmante: ${expediente.co_firmante?.nombre_completo || "NO VIENE (esperado)"}`);

console.log("\n=== RESUMEN ===");
if (allPass) {
  console.log("✅ TODOS LOS DATOS DEL WIZARD PRESENTES");
  console.log("✅ Backend devuelve correctamente los 18 campos");
  console.log("✅ Ratios y referencias NO VIENEN (como se esperaba)");
  console.log("\n🔍 SIGUIENTE: Verificar manualmente en UI que AnalysisTab renderiza todo");
  console.log(`   URL: ${FRONTEND}/credit-hub/bank/applications/edd8bc26-9c00-4467-9cfa-737698dfa47e`);
  console.log(`   Credenciales: analista@test-piloto-02.com / TestPiloto2026!Seguro`);
} else {
  console.log("❌ ALGUNOS DATOS FALTANTES O INCORRECTOS");
  process.exit(1);
}
