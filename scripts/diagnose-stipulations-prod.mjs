// Diagnostic: trace stipulations call against production
const APP_ID = "6a68b243-567b-493d-9b7d-68fd048eb62d";
const BACKEND = "https://api.nadakki.com";

// This requires a valid bank user token from production
const BANK_TOKEN = process.env.BANK_TOKEN || "";

if (!BANK_TOKEN) {
  console.error("❌ BANK_TOKEN env var not set");
  console.log("Usage: BANK_TOKEN=<token> node scripts/diagnose-stipulations-prod.mjs");
  process.exit(1);
}

console.log("=== STIPULATIONS DIAGNOSTIC AGAINST PRODUCTION ===");
console.log(`Application ID: ${APP_ID}`);
console.log(`Backend: ${BACKEND}`);
console.log(`Token present: ${BANK_TOKEN.substring(0, 20)}...`);
console.log();

const url = `${BACKEND}/api/v2/credit/applications/${APP_ID}/stipulations`;

console.log(`Calling: GET ${url}`);
console.log();

try {
  const response = await fetch(url, {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${BANK_TOKEN}`,
      "Content-Type": "application/json",
    },
  });

  console.log(`a) URL exacta: ${response.url}`);
  console.log(`b) Status: ${response.status} ${response.statusText}`);
  console.log();

  const body = await response.text();
  let parsed;
  try {
    parsed = JSON.parse(body);
  } catch {
    parsed = body;
  }

  console.log(`c) Cuerpo de la respuesta:`);
  console.log(JSON.stringify(parsed, null, 2));
  console.log();

  console.log("=== ANALYSIS ===");
  if (response.status === 200) {
    if (parsed && typeof parsed === "object") {
      const stips = parsed.stipulations ?? parsed.items ?? parsed.results ?? [];
      console.log(`✓ Response OK. Stipulations count: ${stips.length}`);
      
      if (stips.length === 0) {
        console.log("✓ Empty list - frontend should show EmptyState 'Sin estipulaciones'");
        console.log("  NOT error state 'Estipulaciones no disponibles'");
      } else {
        console.log(`✓ Has ${stips.length} stipulation(s)`);
      }
    }
  } else {
    console.log(`❌ HTTP error ${response.status}`);
    console.log("  Frontend SHOULD show error state with retry button");
  }
  console.log("=== END DIAGNOSTIC ===");
} catch (error) {
  console.error("❌ Fetch failed:");
  console.error(error);
  console.log("\nThis means:");
  console.log("  - Network error occurred");
  console.log("  - Frontend should show error state 'Estipulaciones no disponibles'");
}
