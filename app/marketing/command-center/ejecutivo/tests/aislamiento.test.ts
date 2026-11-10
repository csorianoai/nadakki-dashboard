/**
 * Regla dura: los datos DEMO no pueden llegar a produccion. Solo page.tsx puede cargar ./demo, y solo con import() dinamico
 * despues de comprobar el flag; ningun otro modulo de la pantalla lo importa.
 */
import { readdirSync, readFileSync, statSync } from "fs";
import { join } from "path";

const RAIZ = join(__dirname, "..");

function archivos(dir: string, salida: string[] = []): string[] {
  for (const n of readdirSync(dir)) {
    const p = join(dir, n);
    if (statSync(p).isDirectory()) {
      if (n === "tests" || n === "demo") continue;
      archivos(p, salida);
    } else if (/\.(ts|tsx)$/.test(n)) salida.push(p);
  }
  return salida;
}

describe("aislamiento de los datos DEMO", () => {
  const fuentes = archivos(RAIZ);

  it("hay archivos de produccion que revisar", () => {
    expect(fuentes.length).toBeGreaterThan(8);
  });

  it("ningun modulo de produccion hace import estatico de ./demo ni de tests/", () => {
    for (const f of fuentes) {
      const s = readFileSync(f, "utf8");
      const estaticos = s.match(/^\s*import[^;]*from\s+["'][^"']*(\/demo\/|\/demo"|tests\/|fixtures)[^"']*["']/gm) ?? [];
      expect({ f, estaticos }).toEqual({ f, estaticos: [] });
    }
  });

  it("page.tsx carga ./demo solo con import() dinamico y despues del flag", () => {
    const s = readFileSync(join(RAIZ, "page.tsx"), "utf8");
    expect(s).toMatch(/await import\(["']\.\/demo\/datos-demo["']\)/);
    expect(s.indexOf("analyticsDemoActivo()")).toBeLessThan(s.indexOf('import("./demo/datos-demo")'));
    expect(s).toMatch(/notFound\(\)/);
  });

  it("el modulo DEMO esta marcado como DEMO/PROTOTIPO en su cabecera", () => {
    const s = readFileSync(join(RAIZ, "demo", "datos-demo.ts"), "utf8");
    expect(s.slice(0, 200)).toMatch(/DEMO \/ PROTOTIPO/);
  });

  it("el flag no depende de variables de Vercel que haya que tocar: solo VERCEL_ENV (sistema) y NEXT_PUBLIC_ANALYTICS_DEMO", () => {
    const s = readFileSync(join(RAIZ, "flag.ts"), "utf8");
    const usadas = Array.from(s.matchAll(/env\.([A-Z_]+)/g)).map((m) => m[1]);
    expect(Array.from(new Set(usadas)).sort()).toEqual(["NEXT_PUBLIC_ANALYTICS_DEMO", "NODE_ENV", "VERCEL_ENV"]);
  });

  it("la pantalla usa SOLO tokens del kit: ni forgeGray/forgeBrand/forgeSurface/forgeSuccess/forgeWarning/forgeDanger/forgeViz ni hex ni clases de color de Tailwind", () => {
    const prohibidos = /forge(Gray|Brand|Surface|Success|Warning|Danger|Viz|Info)-|#[0-9a-fA-F]{3,8}\b|\b(?:bg|text|border|fill|stroke|ring|divide|from|to|via)-(?:white|black|slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)(?:-\d{2,3})?\b/;
    for (const f of fuentes) {
      const s = readFileSync(f, "utf8").replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
      const hallazgos = s.match(new RegExp(prohibidos.source, "g")) ?? [];
      expect({ f: f.replace(RAIZ, ""), hallazgos }).toEqual({ f: f.replace(RAIZ, ""), hallazgos: [] });
    }
  });

  it("la pantalla no fija un locale ni una moneda: nada de Intl, toLocale*, 'es-US' ni 'USD' como literal fuera del adaptador de datos", () => {
    for (const f of fuentes) {
      const s = readFileSync(f, "utf8").replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
      expect({ f: f.replace(RAIZ, ""), intl: /\bIntl\.|toLocale(Date|Time|String)?\(/.test(s) }).toEqual({ f: f.replace(RAIZ, ""), intl: false });
      expect({ f: f.replace(RAIZ, ""), literal: /["'](es-US|en-US|es-AR|USD|ARS)["']/.test(s) }).toEqual({ f: f.replace(RAIZ, ""), literal: false });
    }
  });
});
