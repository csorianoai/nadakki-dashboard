/** @jest-environment node */
import { spawnSync } from "node:child_process";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

const SCRIPT = resolve(__dirname, "sin-console-credit-hub.mjs");
const run = (cwd: string) => spawnSync(process.execPath, [SCRIPT, cwd], { encoding: "utf8" });

describe("guard sin-console-credit-hub", () => {
  let tmp: string;
  beforeEach(() => {
    tmp = mkdtempSync(join(tmpdir(), "guard-"));
  });
  afterEach(() => rmSync(tmp, { recursive: true, force: true }));

  const escribir = (rel: string, texto: string) => {
    const f = join(tmp, rel);
    mkdirSync(join(f, ".."), { recursive: true });
    writeFileSync(f, texto);
  };

  it("falla con fichero:línea si hay console.log en una ruta protegida", () => {
    escribir("lib/credit-hub/x.ts", 'export const a = 1;\nconsole.log("x");\n');
    const r = run(tmp);
    expect(r.status).toBe(1);
    expect(r.stderr).toContain("lib/credit-hub/x.ts:2");
  });

  it.each(["info", "debug"])("falla con console.%s", (m) => {
    escribir("components/credit-hub/y.tsx", `console.${m}("x");\n`);
    expect(run(tmp).status).toBe(1);
  });

  it("falla en hooks/useAuth*", () => {
    escribir("hooks/useAuthX.ts", 'console.log("x");\n');
    expect(run(tmp).status).toBe(1);
  });

  it("permite warn/error, comentarios, tests y rutas no protegidas", () => {
    escribir("lib/credit-hub/ok.ts", 'console.warn("a");\nconsole.error("b");\n// console.log("c")\n');
    escribir("lib/credit-hub/ok.test.ts", 'console.log("t");\n');
    escribir("lib/credit-hub/__mocks__/m.ts", 'console.log("m");\n');
    escribir("lib/otra/z.ts", 'console.log("z");\n');
    escribir("hooks/useOther.ts", 'console.log("z");\n');
    expect(run(tmp).status).toBe(0);
  });

  it("pasa sobre el árbol real", () => {
    const r = run(resolve(__dirname, "../.."));
    expect(r.stderr).toBe("");
    expect(r.status).toBe(0);
  });
});
