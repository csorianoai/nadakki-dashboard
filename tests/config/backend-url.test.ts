/**
 * P0 · sin destino declarado se falla, no se elige producción.
 *
 * El test DETECTA, no describe: si alguien restaura el default
 * `"https://api.nadakki.com"` en `resolveBackendUrl`, `no_elige_produccion`
 * rompe. Verificado por mutación antes de darlo por bueno.
 *
 * El guard de literales es el que impide que el defecto vuelva por una puerta
 * distinta: había 16 ficheros con ese literal y listas de variables que no
 * coincidían entre sí. Arreglar sólo el resolutor dejaría los otros 15.
 *
 * (usa el entorno por defecto: jest.setup.tsx asume jsdom)
 */

import * as fs from "fs";
import * as path from "path";
import {
  BACKEND_URL_ENV_VARS,
  BackendUrlNotConfiguredError,
  resolveBackendUrl,
  resolveBackendUrlOrNull,
} from "@/lib/config/backend-url";

const VACIO = {} as NodeJS.ProcessEnv;

describe("P0 · resolución del backend", () => {
  test("no_elige_produccion: sin ninguna variable, lanza", () => {
    expect(() => resolveBackendUrl(VACIO)).toThrow(BackendUrlNotConfiguredError);
  });

  test("no_elige_produccion: el mensaje nombra las variables que faltan", () => {
    try {
      resolveBackendUrl(VACIO);
      throw new Error("debió lanzar");
    } catch (e) {
      const msg = (e as Error).message;
      for (const v of BACKEND_URL_ENV_VARS) expect(msg).toContain(v);
      // Y no debe sugerir producción como salida.
      expect(msg).not.toContain("api.nadakki.com");
    }
  });

  test("la variante tolerante devuelve null, nunca producción", () => {
    expect(resolveBackendUrlOrNull(VACIO)).toBeNull();
  });

  test("con destino declarado, lo devuelve sin barra final", () => {
    expect(resolveBackendUrl({ BACKEND_URL: "https://staging.test/" } as NodeJS.ProcessEnv))
      .toBe("https://staging.test");
  });

  test("precedencia: BACKEND_URL gana sobre las NEXT_PUBLIC_*", () => {
    const env = {
      BACKEND_URL: "https://gana.test",
      NEXT_PUBLIC_API_URL: "https://pierde.test",
    } as NodeJS.ProcessEnv;
    expect(resolveBackendUrl(env)).toBe("https://gana.test");
  });

  test("una variable vacía o con espacios no cuenta como declarada", () => {
    expect(() => resolveBackendUrl({ BACKEND_URL: "   " } as NodeJS.ProcessEnv))
      .toThrow(BackendUrlNotConfiguredError);
  });

  test("guard: ningún fichero nuevo introduce el literal de producción", () => {
    // Medido al escribir este test: 16 ficheros lo tenían. Los que quedan están
    // declarados abajo con su motivo. La lista sólo puede ENCOGER.
    const PERMITIDOS = new Set<string>([
      // CSP: declara el origen permitido para connect-src, no es un destino.
      "next.config.js",
    ]);

    const raiz = path.resolve(__dirname, "..", "..");
    const dirs = ["app", "lib", "components", "hooks"];
    const hallados: string[] = [];

    const recorrer = (dir: string) => {
      for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
        const p = path.join(dir, e.name);
        if (e.isDirectory()) {
          if (e.name === "node_modules" || e.name === ".next") continue;
          recorrer(p);
        } else if (/\.(ts|tsx|js|mjs)$/.test(e.name)) {
          const rel = path.relative(raiz, p).split(path.sep).join("/");
          if (PERMITIDOS.has(rel)) continue;
          if (fs.readFileSync(p, "utf8").includes("api.nadakki.com")) hallados.push(rel);
        }
      }
    };
    for (const d of dirs) {
      const abs = path.join(raiz, d);
      if (fs.existsSync(abs)) recorrer(abs);
    }

    expect(hallados).toEqual([]);
  });
});
