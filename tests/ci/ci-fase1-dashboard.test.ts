/**
 * G2 (Cesar, 2026-11-01): puerta de CI de la fase 1 de marketing en el dashboard.
 * Build de produccion + Playwright de e2e/fase1 con el backend SIEMPRE interceptado, en los runners ci-8g, y al final
 * `git diff --exit-code`. Estos tests fijan el contrato del workflow y de playwright.config.fase1.ts; no lanzan navegador.
 */
import fs from "fs";
import path from "path";

// Playwright prohibe cargarse dos veces en un proceso: la config se evalua aqui con un defineConfig de papel.
jest.mock("@playwright/test", () => ({
  defineConfig: (c: unknown) => c,
  devices: { "Desktop Chrome": { viewport: { width: 1280, height: 720 } } },
}));

const RAIZ = path.resolve(__dirname, "../..");
const WORKFLOW = fs.readFileSync(path.join(RAIZ, ".github/workflows/ci-fase1-dashboard.yml"), "utf8");
// Sin comentarios: las reglas se aplican al YAML, no a lo que dice un comentario.
const CODIGO = WORKFLOW.split("\n").filter((l) => !l.trim().startsWith("#")).join("\n");

// El guard de red parchea modulos de Node (net, dns, dgram) de forma global: en el proceso de jest se sustituye por un papel;
// su comportamiento real se prueba en tests/ci/ci-fase1-red-loopback.test.ts con procesos hijos.
jest.mock("../../e2e/fase1/_solo-loopback.cjs", () => ({ instalado: true }), { virtual: true });

let entornoTrasCargar: NodeJS.ProcessEnv = {};

function cargarConfig(env: Record<string, string | undefined> = {}) {
  const entornoPrevio = { ...process.env };   // la config toca process.env (proxies, NODE_OPTIONS): se restaura entero
  for (const k of Object.keys(env)) {
    if (env[k] === undefined) delete process.env[k];
    else process.env[k] = env[k];
  }
  try {
    jest.resetModules();
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const cfg = require("../../playwright.config.fase1").default;
    entornoTrasCargar = { ...process.env };   // lo que ven Playwright (main y workers) y, por herencia, next start
    return cfg;
  } finally {
    for (const k of Object.keys(process.env)) if (!(k in entornoPrevio)) delete process.env[k];
    Object.assign(process.env, entornoPrevio);
  }
}

describe("workflow ci-fase1-dashboard", () => {
  test("corre en pull_request a staging y a main, sin filtros de ruta", () => {
    expect(CODIGO).toMatch(/pull_request:\s*\n\s*branches:\s*\n\s*- staging\s*\n\s*- main/);
    expect(CODIGO).not.toMatch(/paths(-ignore)?:/);
  });

  test("es bloqueante: sin continue-on-error, sin || true y sin if en el job", () => {
    expect(CODIGO).not.toMatch(/continue-on-error/);
    expect(CODIGO).not.toMatch(/\|\|\s*true/);
    expect(CODIGO).not.toMatch(/^\s{4}if:/m);
  });

  test("corre en los runners ci-8g", () => {
    expect(CODIGO).toMatch(/runs-on:\s*\[self-hosted,\s*ci-8g\]/);
  });

  test("el backend esta siempre interceptado: backend.invalid y ninguna URL externa", () => {
    expect(CODIGO).toMatch(/NEXT_PUBLIC_BACKEND_URL:\s*http:\/\/backend\.invalid/);
    expect(CODIGO).toMatch(/BACKEND_URL:\s*http:\/\/backend\.invalid/);
    expect(CODIGO).not.toMatch(/PLAYWRIGHT_BASE_URL|\bBASE_URL:/);
    expect(CODIGO).not.toMatch(/secrets\./);
  });

  test("orden: build, navegador, playwright con la config de fase 1 y git diff --exit-code al final", () => {
    const build = CODIGO.indexOf("run: npm run build");
    const chromium = CODIGO.indexOf("npx playwright install chromium");
    const canario = CODIGO.indexOf("run: node e2e/fase1/_canario-red.cjs");
    const pw = CODIGO.indexOf("npx playwright test -c playwright.config.fase1.ts");
    const diff = CODIGO.lastIndexOf("run: git diff --exit-code");
    expect(build).toBeGreaterThan(-1);
    expect(build).toBeLessThan(chromium);
    expect(chromium).toBeLessThan(canario);
    expect(canario).toBeGreaterThan(-1);
    expect(canario).toBeLessThan(pw);
    expect(pw).toBeLessThan(diff);
    expect(CODIGO.trimEnd().endsWith("run: git diff --exit-code")).toBe(true);
  });
});

describe("workflow ci-fase1-dashboard: credenciales y red", () => {
  test("actions/checkout no deja credenciales en el .git del runner (persist-credentials: false)", () => {
    expect(CODIGO).toMatch(/uses: actions\/checkout@v4\s*\n\s*with:\s*\n\s*persist-credentials: false/);
  });

  test("el entorno del job no declara proxies", () => {
    expect(CODIGO).not.toMatch(/\b(HTTP_PROXY|HTTPS_PROXY|ALL_PROXY|http_proxy|https_proxy|all_proxy)\b/);
  });

  test("hay un canario de red de Node en el job, con la version de Node del job", () => {
    expect(CODIGO).toMatch(/- name: Canario de red[^\n]*\n\s*run: node e2e\/fase1\/_canario-red\.cjs/);
  });
});

describe("playwright.config.fase1", () => {
  test("prueba solo e2e/fase1, sin reintentos y con forbidOnly", () => {
    const cfg = cargarConfig({ CI: "1", PLAYWRIGHT_BASE_URL: undefined, BASE_URL: undefined });
    expect(cfg.testDir).toBe("./e2e/fase1");
    expect(cfg.retries).toBe(0);
    expect(cfg.forbidOnly).toBe(true);
  });

  test("el navegador no resuelve ningun host salvo 127.0.0.1: lo no interceptado falla", () => {
    const cfg = cargarConfig({ PLAYWRIGHT_BASE_URL: undefined, BASE_URL: undefined });
    const args: string[] = cfg.use.launchOptions.args;
    expect(args).toContain("--host-resolver-rules=MAP * ~NOTFOUND , EXCLUDE 127.0.0.1");
    // Sin proxy: con un proxy en el entorno (HTTPS_PROXY) Chromium le pasa el CONNECT y es el PROXY quien resuelve el
    // host, asi que host-resolver-rules no bloquea nada. Medido: sin esto el error era ERR_TUNNEL_CONNECTION_FAILED;
    // con --no-proxy-server, ERR_NAME_NOT_RESOLVED.
    expect(args).toContain("--no-proxy-server");
  });

  test("el servidor local arranca con el backend falso", () => {
    const cfg = cargarConfig({ PLAYWRIGHT_BASE_URL: undefined, BASE_URL: undefined });
    expect(cfg.webServer.command).toMatch(/^npx next start -p \d+$/);
    expect(cfg.webServer.env.BACKEND_URL).toBe("http://backend.invalid");
    expect(cfg.webServer.env.NEXT_PUBLIC_API_URL).toBe("http://backend.invalid");
    expect(cfg.webServer.env.NEXT_PUBLIC_BACKEND_URL).toBe("http://backend.invalid");
    expect(cfg.use.baseURL).toMatch(/^http:\/\/127\.0\.0\.1:\d+$/);
  });

  test("rechaza la variable aunque este vacia: se mira si EXISTE, no su valor", () => {
    expect(() => cargarConfig({ PLAYWRIGHT_BASE_URL: "" })).toThrow(/hermetic|hermet/i);
    expect(() => cargarConfig({ BASE_URL: "" })).toThrow(/hermetic|hermet/i);
    expect(() => cargarConfig({ PLAYWRIGHT_BASE_URL: "   " })).toThrow(/hermetic|hermet/i);
  });

  test("el servidor y Playwright arrancan SIN proxies en el entorno", () => {
    const proxies = { HTTP_PROXY: "http://p:3128", HTTPS_PROXY: "http://p:3128", ALL_PROXY: "http://p:3128",
                      http_proxy: "http://p:3128", https_proxy: "http://p:3128", all_proxy: "http://p:3128" };
    const cfg = cargarConfig({ ...proxies, PLAYWRIGHT_BASE_URL: undefined, BASE_URL: undefined });
    for (const k of Object.keys(proxies)) {
      expect(Object.keys(cfg.webServer.env)).not.toContain(k);
      expect(Object.keys(entornoTrasCargar)).not.toContain(k);   // borrados del entorno de Playwright y de sus hijos
    }
  });

  test("next start y los workers heredan el guard de red por NODE_OPTIONS, y sin telemetria", () => {
    const cfg = cargarConfig({ NODE_OPTIONS: "--max-old-space-size=2048", PLAYWRIGHT_BASE_URL: undefined, BASE_URL: undefined });
    expect(cfg.webServer.env.NODE_OPTIONS).toMatch(/--require=\S*e2e\/fase1\/_solo-loopback\.cjs/);
    expect(cfg.webServer.env.NODE_OPTIONS).toContain("--max-old-space-size=2048");   // se anade, no se pisa
    expect(cfg.webServer.env.NEXT_TELEMETRY_DISABLED).toBe("1");
  });

  test("rechaza una URL externa: esta puerta nunca apunta a un backend real", () => {
    expect(() => cargarConfig({ PLAYWRIGHT_BASE_URL: "https://staging.example.com" })).toThrow(/hermetic|hermet/i);
    expect(() => cargarConfig({ BASE_URL: "https://staging.example.com" })).toThrow(/hermetic|hermet/i);
  });
});
