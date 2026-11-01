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

function cargarConfig(env: Record<string, string | undefined> = {}) {
  const previo: Record<string, string | undefined> = {};
  for (const k of Object.keys(env)) {
    previo[k] = process.env[k];
    if (env[k] === undefined) delete process.env[k];
    else process.env[k] = env[k];
  }
  try {
    jest.resetModules();
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require("../../playwright.config.fase1").default;
  } finally {
    for (const k of Object.keys(previo)) {
      if (previo[k] === undefined) delete process.env[k];
      else process.env[k] = previo[k];
    }
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
    const pw = CODIGO.indexOf("npx playwright test -c playwright.config.fase1.ts");
    const diff = CODIGO.lastIndexOf("run: git diff --exit-code");
    expect(build).toBeGreaterThan(-1);
    expect(build).toBeLessThan(chromium);
    expect(chromium).toBeLessThan(pw);
    expect(pw).toBeLessThan(diff);
    expect(CODIGO.trimEnd().endsWith("run: git diff --exit-code")).toBe(true);
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
  });

  test("el servidor local arranca con el backend falso", () => {
    const cfg = cargarConfig({ PLAYWRIGHT_BASE_URL: undefined, BASE_URL: undefined });
    expect(cfg.webServer.command).toMatch(/^npx next start -p \d+$/);
    expect(cfg.webServer.env.BACKEND_URL).toBe("http://backend.invalid");
    expect(cfg.webServer.env.NEXT_PUBLIC_API_URL).toBe("http://backend.invalid");
    expect(cfg.webServer.env.NEXT_PUBLIC_BACKEND_URL).toBe("http://backend.invalid");
    expect(cfg.use.baseURL).toMatch(/^http:\/\/127\.0\.0\.1:\d+$/);
  });

  test("rechaza una URL externa: esta puerta nunca apunta a un backend real", () => {
    expect(() => cargarConfig({ PLAYWRIGHT_BASE_URL: "https://staging.example.com" })).toThrow(/hermetic|hermet/i);
    expect(() => cargarConfig({ BASE_URL: "https://staging.example.com" })).toThrow(/hermetic|hermet/i);
  });
});
