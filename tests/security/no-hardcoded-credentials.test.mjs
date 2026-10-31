// T8 — ninguna credencial ni URL de produccion escrita en el codigo de pruebas.
// Ejecutar:  node --test tests/security/no-hardcoded-credentials.test.mjs
// (Jest no recoge archivos .mjs: testMatch de jest.config.js solo admite .[jt]s(x)).
import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");

const CODE_FILES = [
  "e2e/api-only-tests.spec.ts",
  "e2e/capture-stipulations-diagnostic.spec.ts",
  "scripts/diagnose-tabs-local.mjs",
  "scripts/measure-expediente-backend.mjs",
];
const DOC_FILES = ["DIAGNOSTIC_CAPTURE.md"];
const ZONE_FILES = [...CODE_FILES, ...DOC_FILES];

const git = (args) => spawnSync("git", args, { cwd: root, encoding: "utf8" });

// Asignacion de un literal entre comillas a una variable o clave que contiene "password":
//   const X_PASSWORD = "...";  PASSWORD: string = '...';  password: `...`;  "password": "..."
const QUOTED_PASSWORD_LITERAL =
  /[\w$.\-]*password[\w$.\-]*["']?\s*(?::\s*[\w<>[\]|]+\s*)?[:=]\s*(["'`])(?:(?!\1)[^\n])+\1/i;
// En Markdown: "Password: valor", "PASSWORD=valor" (valor sin comillas, que no sea marcador <...>, ${...} ni codigo).
const UNQUOTED_PASSWORD_VALUE = /password[\w$.\-]*\s*[:=]\s*`?[^\s`<$({]{3,}/i;

function literalPasswordLines(file) {
  const isDoc = DOC_FILES.includes(file);
  return readFileSync(path.join(root, file), "utf8")
    .split(/\r?\n/)
    .map((text, i) => ({ n: i + 1, text }))
    .filter(({ text }) => QUOTED_PASSWORD_LITERAL.test(text) || (isDoc && UNQUOTED_PASSWORD_VALUE.test(text)))
    .map(({ n }) => n); // solo numeros de linea: nunca se imprime el contenido
}

test("(1) .env.e2e.local no esta versionado", () => {
  const r = git(["ls-files", ".env.e2e.local"]);
  assert.equal(r.status, 0);
  assert.equal(r.stdout.trim(), "");
});

test("(2) .env.e2e.local esta ignorado por .gitignore (git check-ignore sale con 0)", () => {
  const r = git(["check-ignore", ".env.e2e.local"]);
  assert.equal(r.status, 0, "git check-ignore deberia salir con 0");
});

test("(3a) el detector reconoce literales y no da falsos positivos", () => {
  for (const malo of [
    'const BANK_PASSWORD = "abc12345";',
    "const PASSWORD: string = 'abc12345';",
    "password: `abc12345`,",
    '"password": "abc12345"',
  ]) assert.ok(QUOTED_PASSWORD_LITERAL.test(malo), `deberia detectar: ${malo.length} caracteres`);
  assert.ok(UNQUOTED_PASSWORD_VALUE.test("PASSWORD=abc12345"));
  assert.ok(UNQUOTED_PASSWORD_VALUE.test("- Password: abc12345"));
  for (const bueno of [
    "password: DEALER_PASSWORD,",
    "password: process.env.QA_DEALER_PASSWORD",
    "const { QA_BANK_PASSWORD: PASSWORD } = requireEnv('QA_BANK_PASSWORD');",
    "await page.fill('input[type=\"password\"], input[name=\"password\"]', PASSWORD);",
    "let BANK_PASSWORD: string;",
  ]) assert.ok(!QUOTED_PASSWORD_LITERAL.test(bueno), `no deberia detectar: ${bueno.length} caracteres`);
  assert.ok(!UNQUOTED_PASSWORD_VALUE.test("variables `QA_BANK_EMAIL` y `QA_BANK_PASSWORD` (nombres)"));
});

test("(3) los 5 archivos de la zona no tienen asignaciones literales a variables o claves con 'password'", () => {
  assert.equal(ZONE_FILES.length, 5);
  const hallazgos = ZONE_FILES.map((f) => ({ f, lineas: literalPasswordLines(f) })).filter((x) => x.lineas.length > 0);
  assert.deepEqual(hallazgos, [], "archivos y lineas con literal de password (contenido no mostrado)");
});

test("(4) ninguna URL de produccion en los archivos de la zona dentro de e2e/ y scripts/", () => {
  const r = git(["grep", "-n", "-E", "api\\.nadakki\\.com|dashboard\\.nadakki\\.com", "--", "e2e", "scripts"]);
  assert.ok(r.status === 0 || r.status === 1, "git grep fallo");
  const lineas = r.stdout
    .split("\n")
    .filter(Boolean)
    .filter((l) => ZONE_FILES.some((f) => l.startsWith(`${f}:`)));
  assert.equal(lineas.length, 0, `lineas con URL de produccion: ${lineas.map((l) => l.split(":").slice(0, 2).join(":")).join(", ")}`);
});

test("(5) measure-expediente-backend.mjs sin variables de entorno falla con mensaje claro y sin tocar la red", () => {
  // Precarga que convierte cualquier intento de red en exit 97 con una marca en stderr.
  const trampa = `
    import http from "node:http"; import https from "node:https"; import net from "node:net";
    const trap = (que) => { process.stderr.write("NETWORK_ATTEMPT " + que + "\\n"); process.exit(97); };
    globalThis.fetch = () => trap("fetch");
    http.request = () => trap("http.request"); http.get = () => trap("http.get");
    https.request = () => trap("https.request"); https.get = () => trap("https.get");
    net.connect = () => trap("net.connect"); net.Socket.prototype.connect = () => trap("socket.connect");
  `;
  const r = spawnSync(
    process.execPath,
    ["--import", `data:text/javascript,${encodeURIComponent(trampa)}`, "scripts/measure-expediente-backend.mjs"],
    { cwd: root, encoding: "utf8", timeout: 30_000, env: { PATH: process.env.PATH ?? "", HOME: process.env.HOME ?? "" } }
  );
  assert.equal(r.error, undefined, "el proceso no debe fallar por timeout ni por no arrancar");
  assert.notEqual(r.status, 0, "debe terminar con exit distinto de 0");
  assert.notEqual(r.status, 97, "no debe intentar ninguna conexion de red");
  assert.ok(!/NETWORK_ATTEMPT/.test(r.stdout + r.stderr), "no debe haber intento de red");
  assert.match(r.stderr, /Faltan credenciales de prueba/);
  for (const n of ["QA_DEALER_EMAIL", "QA_DEALER_PASSWORD", "QA_BANK_EMAIL", "QA_BANK_PASSWORD"]) {
    assert.ok(r.stderr.includes(n), `el mensaje debe nombrar ${n}`);
  }
  assert.ok(!/STEP 1/.test(r.stdout), "no debe llegar al primer paso (login)");
});
