/** @jest-environment node */
/**
 * Aislamiento de apps/** respecto del panel (dash#1138, decision de Cesar 2026-11-07 y 2026-11-10).
 *
 * El motor de Sites vive en apps/sites-engine/ con su propio package.json, lockfile y pruebas, y se despliega como un
 * proyecto de Vercel separado. Cuatro puntos del panel lo absorberian si no se aislaran; cada uno se fija aqui:
 *   1) jest (testPathIgnorePatterns y modulePathIgnorePatterns),
 *   2) el typecheck global (tsconfig.json exclude),
 *   3) el hook de despliegue de main (paths-ignore),
 *   4) el clasificador del CI (.github/workflows/ci.yml): un PR que solo toca apps/ no puede marcar
 *      PRODUCT_OR_HARNESS_CHANGED=YES (daba SOURCE_CHANGED_WITH_ZERO_RELATED_TESTS: ninguna prueba del panel lo relaciona).
 * Este fichero importa jest.config.js, asi que `jest --changedSince` lo relaciona con cualquier cambio de esa config.
 */
import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

const RAIZ = resolve(__dirname, "../..");
// eslint-disable-next-line @typescript-eslint/no-require-imports
const jestConfig = require("../../jest.config.js") as {
  testPathIgnorePatterns?: string[];
  modulePathIgnorePatterns?: string[];
};
const leer = (rel: string) => readFileSync(join(RAIZ, rel), "utf8");

/** Patron de jest con <rootDir> resuelto, como lo evalua jest (expresion regular sobre la ruta absoluta). */
const ignora = (patrones: string[] | undefined, rutaAbs: string) =>
  (patrones ?? []).some((p) => new RegExp(p.replace("<rootDir>", RAIZ)).test(rutaAbs));

describe("aislamiento de apps/ respecto del panel", () => {
  describe("jest", () => {
    it("[positivo] los tests y modulos de apps/ no entran en el jest del panel", () => {
      expect(jestConfig.testPathIgnorePatterns).toContain("<rootDir>/apps/");
      expect(jestConfig.modulePathIgnorePatterns).toContain("<rootDir>/apps/");
      expect(ignora(jestConfig.testPathIgnorePatterns, join(RAIZ, "apps/sites-engine/tests/b.test.ts"))).toBe(true);
      expect(ignora(jestConfig.modulePathIgnorePatterns, join(RAIZ, "apps/sites-engine/src/x.ts"))).toBe(true);
    });

    it("[negativo] no se pierden los tests del panel ni el /node_modules/ por defecto ni /legacy/", () => {
      expect(jestConfig.testPathIgnorePatterns).toContain("/node_modules/");
      expect(jestConfig.modulePathIgnorePatterns).toContain("<rootDir>/legacy/");
      expect(ignora(jestConfig.testPathIgnorePatterns, join(RAIZ, "tests/a.test.ts"))).toBe(false);
      expect(ignora(jestConfig.testPathIgnorePatterns, join(RAIZ, "scripts/ci/c.test.js"))).toBe(false);
      // una carpeta que solo empieza por «apps» no es apps/
      expect(ignora(jestConfig.testPathIgnorePatterns, join(RAIZ, "appsx/tests/d.test.ts"))).toBe(false);
    });
  });

  describe("typecheck global", () => {
    const tsconfig = JSON.parse(leer("tsconfig.json")) as { exclude?: string[] };

    it("[positivo] tsconfig.json excluye apps", () => {
      expect(tsconfig.exclude).toContain("apps");
    });

    it("[negativo] conserva las exclusiones anteriores", () => {
      for (const e of ["node_modules", "_handoff", "tests", "e2e", "playwright.config.ts"]) {
        expect(tsconfig.exclude).toContain(e);
      }
    });
  });

  describe("hook de despliegue de main", () => {
    const yml = leer(".github/workflows/vercel-deploy-hook-main.yml");

    it("[positivo] un push a main solo con cambios de apps/ no redespliega el panel", () => {
      expect(yml).toMatch(/paths-ignore:\s*\n\s*-\s*['"]?apps\/\*\*['"]?/);
    });

    it("[negativo] sigue disparando con push a main y con workflow_dispatch", () => {
      expect(yml).toMatch(/branches:\s*\[main\]|branches:\s*\n\s*-\s*main/);
      expect(yml).toContain("workflow_dispatch");
    });
  });

  describe("clasificador del CI (.github/workflows/ci.yml)", () => {
    // El bucle que decide PRODUCT_OR_HARNESS_CHANGED, tal cual esta en ci.yml, ejecutado con bash sobre una lista de rutas.
    const ci = leer(".github/workflows/ci.yml");
    const ini = ci.indexOf('PRODUCT_OR_HARNESS_CHANGED="NO"');
    const fin = ci.indexOf('echo "PRODUCT_OR_HARNESS_CHANGED=${PRODUCT_OR_HARNESS_CHANGED}"');
    const bloque = ci.slice(ini, fin);

    const clasificar = (rutas: string[]): string => {
      const tmp = mkdtempSync(join(tmpdir(), "clasif-"));
      try {
        const lista = join(tmp, "changed.txt");
        writeFileSync(lista, rutas.join("\n") + "\n");
        const r = spawnSync("bash", ["-c", `CHANGED_FILE="${lista}"\n${bloque}\necho "RESULTADO=\${PRODUCT_OR_HARNESS_CHANGED}"`], {
          encoding: "utf8",
        });
        expect(r.status).toBe(0);
        return /RESULTADO=(\w+)/.exec(r.stdout)?.[1] ?? "";
      } finally {
        rmSync(tmp, { recursive: true, force: true });
      }
    };

    it("el bloque se extrajo entero", () => {
      expect(ini).toBeGreaterThan(0);
      expect(fin).toBeGreaterThan(ini);
    });

    it("[positivo] un PR que solo toca apps/ (package.json, lockfile, .js, .ts) no cuenta como cambio del panel", () => {
      expect(
        clasificar([
          "apps/sites-engine/package.json",
          "apps/sites-engine/package-lock.json",
          "apps/sites-engine/reference/baylara-web/app/api/lead/route.js",
          "apps/sites-engine/src/proxy.ts",
          "apps/sites-engine/tsconfig.json",
        ]),
      ).toBe("NO");
    });

    it("[negativo] un cambio del panel sigue marcando YES, solo o mezclado con apps/", () => {
      expect(clasificar(["lib/x.ts"])).toBe("YES");
      expect(clasificar(["package.json"])).toBe("YES");
      expect(clasificar(["jest.config.js"])).toBe("YES");
      expect(clasificar(["tsconfig.json"])).toBe("YES");
      expect(clasificar(["apps/sites-engine/package.json", "components/y.tsx"])).toBe("YES");
    });

    it("[negativo] solo se excluye la carpeta apps/, no cualquier ruta que empiece por «apps»", () => {
      expect(clasificar(["appsx/foo.ts"])).toBe("YES");
      expect(clasificar(["app/page.tsx"])).toBe("YES");
    });
  });
});
