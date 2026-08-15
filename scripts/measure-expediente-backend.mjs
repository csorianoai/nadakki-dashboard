// FASE 1: Medir qué devuelve el backend para expediente/full
const BACKEND = "https://api.nadakki.com";

// Step 1: Login as dealer and create full application
console.log("=== STEP 1: Dealer login ===");
const dealerLoginRes = await fetch(`${BACKEND}/api/v2/auth/login`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    email: "dealer.qa@test-piloto-02.com",
    password: "DealerQA2026!Seguro"
  }),
});

if (!dealerLoginRes.ok) {
  console.error(`Dealer login failed: ${dealerLoginRes.status}`);
  const error = await dealerLoginRes.text();
  console.error(error);
  process.exit(1);
}

const dealerLogin = await dealerLoginRes.json();
const dealerToken = dealerLogin.token || dealerLogin.access_token;
console.log("✓ Dealer logged in");

// Step 2: Create application with ALL wizard fields
console.log("\n=== STEP 2: Creating full application ===");
const applicationPayload = {
  applicant: {
    cedula: "402-1234567-8",
    nombre_completo: "Juan Pérez Medina",
    email: "juan.perez.test@example.com",
    telefono: "+1-809-555-1234",
    fecha_nacimiento: "1985-03-15",
    direccion: "Calle Principal #123, Santo Domingo",
    
    // INGRESOS Y EMPLEO
    ingreso_mensual: 75000,
    nombre_empleador: "Empresa ABC S.A.",
    puesto_trabajo: "Gerente de Ventas",
    anos_empleo: 5,
    meses_empleo: 3,
    
    // DEUDAS
    deudas_vigentes: 15000,
    pago_mensual_deudas: 3500,
  },
  
  // CO-FIRMANTE / GARANTE
  co_firmante: {
    nombre_completo: "María González",
    cedula: "402-9876543-2",
    telefono: "+1-809-555-5678",
    relacion: "Esposa",
    ingreso_mensual: 50000,
  },
  
  // REFERENCIAS PERSONALES (3)
  referencias_personales: [
    {
      nombre: "Carlos Rodríguez",
      telefono: "+1-809-555-1111",
      relacion: "Amigo",
    },
    {
      nombre: "Ana Martínez",
      telefono: "+1-809-555-2222",
      relacion: "Compañero de trabajo",
    },
    {
      nombre: "Luis Fernández",
      telefono: "+1-809-555-3333",
      relacion: "Familiar",
    },
  ],
  
  // VEHÍCULO
  vehicle: {
    marca: "Toyota",
    modelo: "Corolla",
    ano: 2022,
    vin: "5TDJKRFH3NS123456",
    condicion: "usado",
    valuacion: 1200000,
    kilometraje: 25000,
  },
  
  // OPERACIÓN FINANCIERA
  financial: {
    monto_solicitado: 600000,
    plazo_meses: 60,
    enganche: 200000,
    fuente_enganche: "Ahorros personales",
  },
};

const createAppRes = await fetch(`${BACKEND}/api/v2/credit/applications`, {
  method: "POST",
  headers: {
    "Authorization": `Bearer ${dealerToken}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    application_payload: applicationPayload,
  }),
});

if (!createAppRes.ok) {
  console.error(`Create application failed: ${createAppRes.status}`);
  const error = await createAppRes.text();
  console.error(error);
  process.exit(1);
}

const createAppData = await createAppRes.json();
const applicationId = createAppData.application_id || createAppData.id;
console.log(`✓ Application created: ${applicationId}`);

// Step 3: Login as analyst
console.log("\n=== STEP 3: Analyst login ===");
const analystLoginRes = await fetch(`${BACKEND}/api/v2/auth/login`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    email: "analista@test-piloto-02.com",
    password: "TestPiloto2026!Seguro"
  }),
});

if (!analystLoginRes.ok) {
  console.error(`Analyst login failed: ${analystLoginRes.status}`);
  const error = await analystLoginRes.text();
  console.error(error);
  process.exit(1);
}

const analystLogin = await analystLoginRes.json();
const analystToken = analystLogin.token || analystLogin.access_token;
console.log("✓ Analyst logged in");

// Step 4: Get expediente/full
console.log("\n=== STEP 4: Fetching expediente/full ===");
const expedienteRes = await fetch(`${BACKEND}/api/v2/credit/applications/${applicationId}/expediente/full`, {
  method: "GET",
  headers: {
    "Authorization": `Bearer ${analystToken}`,
    "Content-Type": "application/json",
  },
});

if (!expedienteRes.ok) {
  console.error(`Expediente fetch failed: ${expedienteRes.status}`);
  const error = await expedienteRes.text();
  console.error(error);
  process.exit(1);
}

const expediente = await expedienteRes.json();
console.log("✓ Expediente fetched");

// Step 5: Generate field-by-field table
console.log("\n=== TABLA DE CAMPOS ===\n");
console.log("| Campo | Ruta en respuesta | Estado |");
console.log("|-------|-------------------|--------|");

const fields = [
  { name: "Ingresos mensuales", path: ["applicant", "ingreso_mensual"] },
  { name: "Empleo (empresa)", path: ["applicant", "nombre_empleador"] },
  { name: "Puesto de trabajo", path: ["applicant", "puesto_trabajo"] },
  { name: "Antigüedad laboral (años)", path: ["applicant", "anos_empleo"] },
  { name: "Antigüedad laboral (meses)", path: ["applicant", "meses_empleo"] },
  { name: "Deudas vigentes", path: ["applicant", "deudas_vigentes"] },
  { name: "Pagos mensuales de deuda", path: ["applicant", "pago_mensual_deudas"] },
  { name: "PTI (Payment to Income)", path: ["analysis", "pti"] },
  { name: "DTI (Debt to Income)", path: ["analysis", "dti"] },
  { name: "LTV (Loan to Value)", path: ["analysis", "ltv"] },
  { name: "Referencia personal 1", path: ["referencias_personales", 0, "nombre"] },
  { name: "Referencia personal 2", path: ["referencias_personales", 1, "nombre"] },
  { name: "Referencia personal 3", path: ["referencias_personales", 2, "nombre"] },
  { name: "Co-firmante nombre", path: ["co_firmante", "nombre_completo"] },
  { name: "Co-firmante ingresos", path: ["co_firmante", "ingreso_mensual"] },
  { name: "VIN/Chasis", path: ["vehicle", "vin"] },
  { name: "Condición vehículo", path: ["vehicle", "condicion"] },
  { name: "Valuación vehículo", path: ["vehicle", "valuacion"] },
  { name: "Marca vehículo", path: ["vehicle", "marca"] },
  { name: "Modelo vehículo", path: ["vehicle", "modelo"] },
  { name: "Año vehículo", path: ["vehicle", "ano"] },
  { name: "Fuente del enganche", path: ["financial", "fuente_enganche"] },
  { name: "Monto enganche", path: ["financial", "enganche"] },
  { name: "Monto solicitado", path: ["financial", "monto_solicitado"] },
  { name: "Plazo (meses)", path: ["financial", "plazo_meses"] },
];

function getNestedValue(obj, path) {
  return path.reduce((current, key) => {
    return current?.[key];
  }, obj);
}

for (const field of fields) {
  const value = getNestedValue(expediente, field.path);
  const pathStr = field.path.join(".");
  
  let status;
  if (value === undefined) {
    status = "NO VIENE";
  } else if (value === null || value === "" || (Array.isArray(value) && value.length === 0)) {
    status = "VACÍO";
  } else {
    status = `VALOR: ${JSON.stringify(value)}`;
  }
  
  console.log(`| ${field.name} | ${pathStr} | ${status} |`);
}

console.log("\n=== RAW RESPONSE (primeros 2000 chars) ===");
console.log(JSON.stringify(expediente, null, 2).substring(0, 2000));
console.log("...");
