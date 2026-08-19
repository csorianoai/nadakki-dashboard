// Verificar estructura exacta de analysis
const BACKEND = "https://api.nadakki.com";

const loginRes = await fetch(`${BACKEND}/api/v2/auth/login`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    email: "analista@test-piloto-02.com",
    password: "TestPiloto2026!Seguro"
  }),
});

const loginData = await loginRes.json();
const token = loginData.token || loginData.access_token;

const expedienteRes = await fetch(`${BACKEND}/api/v2/credit/applications/edd8bc26-9c00-4467-9cfa-737698dfa47e/expediente/full`, {
  headers: { "Authorization": `Bearer ${token}` },
});

const exp = await expedienteRes.json();

console.log("=== ESTRUCTURA ANALYSIS ===");
console.log(JSON.stringify(exp.analysis, null, 2));

console.log("\n=== CO-FIRMANTE ===");
console.log(JSON.stringify(exp.co_firmante, null, 2));

console.log("\n=== REFERENCIAS ===");
console.log(JSON.stringify(exp.referencias_personales, null, 2));
