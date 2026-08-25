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

const TODAS = [
  "BACKEND_URL", "NEXT_PUBLIC_BACKEND_URL", "NEXT_PUBLIC_NADAKKI_API_URL",
  "NEXT_PUBLIC_API_URL", "NEXT_PUBLIC_API_BASE_URL",
] as const;

let guardado: Record<string, string | undefined> = {};

beforeEach(() => {
  // Los tests manipulan process.env en vez de pasar un objeto: pasarle el env
  // como parametro probaba el caso que nunca falla, y por eso no detecto que
  // el acceso calculado rompia en el navegador.
  guardado = {};
  for (const n of TODAS) { guardado[n] = process.env[n]; delete process.env[n]; }
});

afterEach(() => {
  for (const n of TODAS) {
    if (guardado[n] === undefined) delete process.env[n];
    else process.env[n] = guardado[n];
  }
});

describe("P0 · resolución del backend", () => {
  test("no_elige_produccion: sin ninguna variable, lanza", () => {
    expect(() => resolveBackendUrl()).toThrow(BackendUrlNotConfiguredError);
  });

  test("no_elige_produccion: el mensaje nombra las variables que faltan", () => {
    try {
      resolveBackendUrl();
      throw new Error("debió lanzar");
    } catch (e) {
      const msg = (e as Error).message;
      for (const v of BACKEND_URL_ENV_VARS) expect(msg).toContain(v);
      // Y no debe sugerir producción como salida.
      expect(msg).not.toContain("api.nadakki.com");
    }
  });

  test("la variante tolerante devuelve null, nunca producción", () => {
    expect(resolveBackendUrlOrNull()).toBeNull();
  });

  test("con destino declarado, lo devuelve sin barra final", () => {
    process.env.BACKEND_URL = "https://staging.test/";
    expect(resolveBackendUrl()).toBe("https://staging.test");
  });

  test("precedencia: BACKEND_URL gana sobre las NEXT_PUBLIC_*", () => {
    process.env.BACKEND_URL = "https://gana.test";
    process.env.NEXT_PUBLIC_API_URL = "https://pierde.test";
    expect(resolveBackendUrl()).toBe("https://gana.test");
  });

  test("una variable vacía o con espacios no cuenta como declarada", () => {
    process.env.BACKEND_URL = "   ";
    expect(() => resolveBackendUrl()).toThrow(BackendUrlNotConfiguredError);
  });

  test("resuelve SIN pasarle env: el caso del navegador", () => {
    // El test anterior siempre le pasaba un env explicito, que es justo el
    // caso que nunca falla. Con acceso dinamico -env[nombre]- Next no puede
    // inyectar las NEXT_PUBLIC_* en el bundle del cliente, process.env llega
    // vacio y el resolutor lanzaba: la pagina de login dejo de renderizar y el
    // build no lo detecto, porque server-side el acceso dinamico funciona.
    //
    // Darle al sujeto la entrada que necesita no prueba que la vaya a
    // encontrar solo. Este test no le pasa nada.
    process.env.NEXT_PUBLIC_BACKEND_URL = "https://declarado.test";
    expect(resolveBackendUrl()).toBe("https://declarado.test");
  });

  test("guard estatico: el resolutor no usa acceso calculado a process.env", () => {
    /**
     * QUE PRUEBA ESTO Y QUE NO.
     *
     * NO prueba comportamiento. Jest no aplica la sustitucion de Next, asi que
     * `process.env[n]` y `process.env.X` se comportan IDENTICO aca: en Node
     * ambos leen el mismo objeto. Verificado por mutacion — restaurar el acceso
     * calculado deja los 8 tests en verde.
     *
     * Lo que SI hace es impedir que vuelva la FORMA que rompe. La sustitucion
     * de NEXT_PUBLIC_* solo ocurre sobre expresiones literales; un indice
     * calculado deja process.env vacio en el bundle del cliente y el resolutor
     * lanza, tumbando la pagina de login entera.
     *
     * La deteccion real es el test de navegador. Este guard existe porque ese
     * test es lento y puede quedar fuera de CI, y sin esto nada impide
     * reintroducir env[nombre] mañana.
     */
    const src = fs.readFileSync(
      path.resolve(__dirname, "..", "..", "lib", "config", "backend-url.ts"),
      "utf8"
    );
    const sinComentarios = src
      .replace(/\/\*[\s\S]*?\*\//g, "")
      .replace(/\/\/.*/g, "");
    // process.env seguido de [ , en cualquier forma
    expect(sinComentarios).not.toMatch(/process\.env\s*\[/);
    // y ningun .map/.forEach sobre la lista de nombres
    expect(sinComentarios).not.toMatch(/BACKEND_URL_ENV_VARS\s*\.\s*(map|forEach|reduce)/);
    // las cinco tienen que aparecer literales
    for (const v of BACKEND_URL_ENV_VARS) {
      expect(sinComentarios).toContain(`process.env.${v}`);
    }
  });

  test("guard: ningún fichero nuevo introduce el literal de producción", () => {
    // Medido al escribir este test: 16 ficheros lo tenían. Los que quedan están
    // declarados abajo con su motivo. La lista sólo puede ENCOGER.
    const PERMITIDOS = new Set<string>([
      // CSP: declara el origen permitido para connect-src, no es un destino.
      "next.config.js",
      // Comentario de otro packet (#400, "retire stale document-preview 404
      // comments"): el literal aparece en prosa describiendo una medicion, no
      // como destino. Detectado por este guard sobre trafico ajeno, que es
      // para lo que existe.
      "lib/bank/document-preview-api.ts",
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
