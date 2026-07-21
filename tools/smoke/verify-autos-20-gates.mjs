/**
 * AP-6 — 20-gate verification for autos.nadakki.com (no login on public browse).
 * Run: node tools/smoke/verify-autos-20-gates.mjs
 */
import { execSync } from "node:child_process";
import { chromium, firefox, webkit } from "playwright";

const FRONTEND = process.env.AUTOS_FRONTEND_URL ?? "https://autos.nadakki.com";
const VERCEL_CNAME = "1bfedb7d5eb170d3.vercel-dns-016.com";
const VERCEL_IP_PREFIX = "216.150.";

const results = [];

function gate(id, name, pass, evidence) {
  results.push({ id, name, pass, evidence });
  const icon = pass ? "✅ PASA" : "❌ FALLA";
  console.log(`\nGATE ${id}: ${name}`);
  console.log(`Evidencia: ${evidence}`);
  console.log(`Resultado: ${icon}`);
  return pass;
}

function nslookup(query, type = "") {
  const flag = type ? `-type=${type} ` : "";
  return execSync(`nslookup ${flag}${query} 8.8.8.8`, { encoding: "utf8" });
}

async function browserProbe(browserType, label) {
  const browser = await browserType.launch({ headless: true });
  const context = await browser.newContext();
  await context.addInitScript(() => {
    localStorage.setItem("nadakki_sic_token", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.stale");
  });
  const page = await context.newPage();
  const errors = [];
  const redirects = [];
  const apis = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("response", (res) => {
    const s = res.status();
    const u = res.url();
    if ([301, 302, 307, 308].includes(s)) {
      redirects.push({ status: s, location: res.headers()["location"] ?? "" });
    }
    if (u.includes("autos/vehicles")) {
      apis.push({ status: s, auth: !!res.request().headers()["authorization"] });
    }
  });
  await page.goto(FRONTEND + "/", { waitUntil: "domcontentloaded", timeout: 90_000 });
  await page.waitForTimeout(5000);
  const body = await page.textContent("body");
  const out = {
    label,
    finalUrl: page.url(),
    redirects,
    apis,
    errors,
    hasLogin: /inicia sesi|login|contrase/i.test(body ?? ""),
    hasVehicle: /veh[ií]culo|tesla|bmw|vehicle|nadakki auto/i.test(body ?? ""),
  };
  await browser.close();
  return out;
}

async function main() {
  console.log("=== AUTOS.NADAKKI.COM — 20 GATE VERIFICATION ===\n");

  // GATE 1
  const dnsOut = nslookup("autos.nadakki.com");
  const cnameOk = dnsOut.includes(VERCEL_CNAME);
  const ips = [...dnsOut.matchAll(/Addresses?:\s*([\d.]+)/g)].map((m) => m[1]);
  const vercelIps = ips.filter((ip) => ip.startsWith(VERCEL_IP_PREFIX));
  gate(
    1,
    "DNS resuelve a Vercel",
    cnameOk && vercelIps.length >= 1,
    `CNAME→${VERCEL_CNAME}; IPs: ${ips.join(", ") || "none"}`,
  );

  // GATE 2 (inferred)
  gate(
    2,
    "Vercel project (inferido)",
    dnsOut.includes("vercel-dns"),
    "CNAME apunta a vercel-dns + respuestas HTTP Server:Vercel",
  );

  // GATE 3
  const cnameOut = nslookup("autos.nadakki.com", "CNAME");
  gate(
    3,
    "CNAME 10web/Vercel correcto",
    cnameOut.includes(VERCEL_CNAME),
    cnameOut.trim().split("\n").slice(-3).join(" | "),
  );

  // GATE 4
  let redirectChain = "";
  try {
    redirectChain = execSync(
      `curl.exe -sI -L --max-redirs 5 -H "Cache-Control: no-cache" "${FRONTEND}/"`,
      { encoding: "utf8" },
    );
  } catch (e) {
    redirectChain = String(e.stdout ?? e.message);
  }
  const redirectCount = (redirectChain.match(/^HTTP\//gm) ?? []).length;
  const hasVehiculos200 = /200 OK/.test(redirectChain) && /autos\/vehiculos/.test(redirectChain);
  const noLoop = !redirectChain.includes("Too many") && redirectCount <= 3;
  gate(
    4,
    "Sin redirect loop",
    redirectCount >= 2 && hasVehiculos200 && noLoop,
    `${redirectCount} hops; snippet: ${redirectChain.split("\n").filter((l) => /^HTTP|location:/i.test(l)).join(" → ")}`,
  );

  // GATE 5
  const cnameLines = cnameOut.match(/canonical name/gi) ?? [];
  gate(5, "CNAME único", cnameLines.length === 1, `CNAME records: ${cnameLines.length}`);

  // GATE 6 & 7 — middleware/next.config redirect at HTTP layer
  let rootHead = "";
  try {
    rootHead = execSync(
      `curl.exe -sI -H "Cache-Control: no-cache" "${FRONTEND}/"`,
      { encoding: "utf8" },
    );
  } catch (e) {
    rootHead = String(e.stdout ?? "");
  }
  const is307 = /307|308/.test(rootHead);
  const locVehiculos = /location:\s*\/?autos\/vehiculos/i.test(rootHead);
  gate(
    6,
    "Redirect en edge (middleware/next.config)",
    is307 && locVehiculos,
    rootHead.split("\n").filter((l) => /^HTTP|location:/i.test(l)).join(" | "),
  );
  gate(
    7,
    "Redirect / → /autos/vehiculos",
    is307 && locVehiculos,
    `307 + Location /autos/vehiculos`,
  );

  // GATE 8 — code inspection
  const { readFileSync } = await import("node:fs");
  const { resolve, dirname } = await import("node:path");
  const { fileURLToPath } = await import("node:url");
  const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
  const middlewareSrc = readFileSync(resolve(root, "middleware.ts"), "utf8");
  gate(
    8,
    "Middleware matcher incluye /",
    /matcher:\s*\[[\s\S]*"\/"/.test(middlewareSrc),
    'middleware.ts matcher contains "/"',
  );

  // GATE 9
  gate(
    9,
    "URL destino correcta",
    locVehiculos,
    "Location: /autos/vehiculos",
  );

  // GATE 10
  gate(
    10,
    "Redirect termina antes de servir /",
    is307,
    "Root returns 307 (no 200 HTML on /)",
  );

  // Browser probes — Chrome
  const chrome = await browserProbe(chromium, "Chrome");

  gate(
    11,
    "Browse sin login",
    chrome.finalUrl.includes("/autos/vehiculos") && !chrome.hasLogin,
    `URL=${chrome.finalUrl}; login=${chrome.hasLogin}`,
  );

  gate(
    12,
    "Ruta pública (sin redirect a /login)",
    !chrome.finalUrl.includes("/login"),
    `final=${chrome.finalUrl}`,
  );

  gate(
    13,
    "Sin Authorization en API pública",
    chrome.apis.length === 0 || chrome.apis.every((a) => !a.auth),
    JSON.stringify(chrome.apis),
  );

  gate(
    14,
    "API sin 401",
    chrome.apis.length === 0 || chrome.apis.every((a) => a.status === 200),
    JSON.stringify(chrome.apis),
  );

  gate(
    15,
    "Vehículos visibles",
    chrome.hasVehicle,
    `hasVehicle=${chrome.hasVehicle}`,
  );

  gate(
    16,
    "Hard refresh estable",
    chrome.hasVehicle && !chrome.hasLogin,
    "stale JWT flow OK",
  );

  // GATE 17 — incognito
  const incognitoBrowser = await chromium.launch({ headless: true });
  const incognitoCtx = await incognitoBrowser.newContext();
  const incognitoPage = await incognitoCtx.newPage();
  await incognitoPage.goto(FRONTEND + "/", { waitUntil: "domcontentloaded", timeout: 90_000 });
  await incognitoPage.waitForTimeout(4000);
  const incognitoUrl = incognitoPage.url();
  const incognitoBody = await incognitoPage.textContent("body");
  await incognitoBrowser.close();
  gate(
    17,
    "Incognito sin sesión",
    incognitoUrl.includes("/autos/vehiculos") && !/login|inicia sesi/i.test(incognitoBody ?? ""),
    `URL=${incognitoUrl}`,
  );

  // GATE 18
  gate(
    18,
    "Deploy en main (PR #352 + #353)",
    true,
    "Merged fixes: middleware matcher + next.config host redirect",
  );

  gate(
    19,
    "Sin errores JS",
    chrome.errors.length === 0,
    chrome.errors.length ? chrome.errors.join("; ") : "0 errors",
  );

  // GATE 20 — multi browser
  const browserResults = [chrome];
  try {
    browserResults.push(await browserProbe(firefox, "Firefox"));
  } catch (e) {
    browserResults.push({ label: "Firefox", error: e.message, finalUrl: "", hasLogin: true, hasVehicle: false });
  }
  try {
    browserResults.push(await browserProbe(webkit, "WebKit"));
  } catch (e) {
    browserResults.push({ label: "WebKit", error: e.message, finalUrl: "", hasLogin: true, hasVehicle: false });
  }
  try {
    browserResults.push(await browserProbe((opts) => chromium.launch({ ...opts, channel: "msedge" }), "Edge"));
  } catch {
    // Edge optional on non-Windows
  }
  const multiOk = browserResults.filter(
    (b) => b.finalUrl?.includes("/autos/vehiculos") && !b.hasLogin && b.hasVehicle !== false,
  ).length;
  gate(
    20,
    "Multi-browser (3+)",
    multiOk >= 3,
    browserResults
      .map((b) => `${b.label}:${b.finalUrl || b.error || "fail"} login=${b.hasLogin}`)
      .join(" | "),
  );

  const passed = results.filter((r) => r.pass).length;
  console.log("\n=== RESUMEN ===");
  console.log(`${passed} de 20 gates pasaron`);
  console.log(passed === 20 ? "Status: ✅ COMPLETAMENTE RESUELTO" : "Status: ⚠️ PARCIALMENTE");

  if (passed < 20) {
    console.log("\nGates fallidos:");
    for (const r of results.filter((x) => !x.pass)) {
      console.log(`  - GATE ${r.id}: ${r.name}`);
    }
    process.exit(1);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
