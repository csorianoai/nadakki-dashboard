/**
 * Tokens semanticos del kit (components/analytics/kit/tema.css): existen en CLARO y en OSCURO ("azul noche") y cada par
 * texto/superficie, acento/superficie y estado/superficie cumple WCAG AA con los hex reales (respaldos incluidos).
 */
import { readFileSync } from "fs";
import { join } from "path";

const CSS = readFileSync(join(__dirname, "..", "..", "components", "analytics", "kit", "tema.css"), "utf8").replace(/\/\*[\s\S]*?\*\//g, "");

type Decls = Record<string, string>;

/** CSS plano (sin anidar): { selector -> declaraciones }. Un selector repetido se fusiona. */
function reglas(css: string): Map<string, Decls> {
  const out = new Map<string, Decls>();
  for (const m of css.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    const sel = m[1].trim().replace(/\s+/g, " ");
    const d = out.get(sel) ?? {};
    for (const x of m[2].matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)) d[x[1]] = x[2].trim();
    out.set(sel, d);
  }
  return out;
}
const R = reglas(CSS);
const CLARO = R.get(':root, [data-theme="light"]') as Decls;
const OSCURO = R.get('[data-theme="dark"]') as Decls;
const COMPAT_CLARO = R.get(".kit-tema") as Decls;
const COMPAT_OSCURO = R.get('[data-theme="dark"] .kit-tema') as Decls;

/** Resuelve var(--x, respaldo) y var(--kit-y) dentro de un tema; un var(--forge-*) sin respaldo es un error. */
function resolver(valor: string, tema: Decls, extra: Decls = {}, prof = 0): string {
  if (prof > 8) throw new Error("var() circular: " + valor);
  const m = valor.match(/^var\((--[\w-]+)\s*(?:,\s*([^)]+))?\)$/);
  if (!m) return valor.trim();
  const propio = extra[m[1]] ?? tema[m[1]];
  if (propio !== undefined) return resolver(propio, tema, extra, prof + 1);
  if (m[2]) return resolver(m[2], tema, extra, prof + 1);
  throw new Error(`${m[1]} sin valor ni respaldo`);
}
const hex = (tema: Decls, nombre: string, extra: Decls = {}): string => {
  const v = resolver(`var(--${nombre})`, tema, extra);
  if (!/^#[0-9a-f]{6}$/i.test(v)) throw new Error(`--${nombre} no resuelve a #rrggbb: ${v}`);
  return v.toLowerCase();
};

function luminancia(h: string): number {
  const c = [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255).map((x) => (x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4));
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
}
export function contraste(a: string, b: string): number {
  const [x, y] = [luminancia(a), luminancia(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
}

const TEMAS: Array<[string, Decls]> = [
  ["claro", CLARO],
  ["oscuro", OSCURO],
];
const SUPERFICIES = ["superficie", "hundida", "fondo"];
const NOMBRES = [
  "fondo", "superficie", "hundida", "hundida-2",
  "texto", "texto-2", "texto-3", "texto-tenue",
  "borde", "borde-suave", "borde-control",
  "acento", "acento-texto", "acento-fondo", "sobre-acento", "foco",
  "ok", "ok-fondo", "ok-borde", "atencion", "atencion-fondo", "atencion-borde",
  "error", "error-fondo", "error-borde", "error-barra",
  "pendiente", "pendiente-fondo", "pendiente-borde",
  "viz-1", "viz-2", "viz-3", "viz-4", "viz-5", "viz-6", "otros", "sobre-serie",
  "calor-0", "calor-1", "calor-2", "calor-3", "calor-4",
  "calor-texto-0", "calor-texto-1", "calor-texto-2", "calor-texto-3", "calor-texto-4",
];

describe("tema.css · estructura", () => {
  it("define un bloque claro y uno oscuro (data-theme, el mecanismo de Forge)", () => {
    expect(CLARO).toBeDefined();
    expect(OSCURO).toBeDefined();
    expect(COMPAT_OSCURO).toBeDefined();
  });
  it.each(TEMAS)("tema %s: cada token semantico existe y resuelve a un hex", (_n, tema) => {
    for (const nombre of NOMBRES) {
      expect(tema[`--kit-${nombre}`]).toBeDefined();
      expect(hex(tema, `kit-${nombre}`)).toMatch(/^#[0-9a-f]{6}$/);
    }
  });
  it("el oscuro es el azul noche del diseno aprobado (fondo, tarjeta y texto)", () => {
    expect(hex(OSCURO, "kit-fondo")).toBe("#0a101c");
    expect(hex(OSCURO, "kit-superficie")).toBe("#111a2b");
    expect(hex(OSCURO, "kit-texto")).toBe("#e8edf5");
    expect(hex(OSCURO, "kit-acento")).toBe("#4c8dff");
  });
  it("las clases .kit-* que usan los componentes existen en la hoja", () => {
    for (const c of ["kit-txt", "kit-bd", "kit-bg-sup", "kit-ctl", "kit-ctl-activo", "kit-foco", "kit-calor-0", "kit-calor-4", "kit-tema"]) {
      expect(CSS).toContain("." + c);
    }
  });
});

describe.each(TEMAS)("tema %s · contraste AA con los hex reales", (nombre, tema) => {
  const par = (fg: string, bg: string) => contraste(hex(tema, `kit-${fg}`), hex(tema, `kit-${bg}`));

  it.each(["texto", "texto-2", "texto-3", "acento-texto"])("texto %s >= 4,5:1 sobre superficie, hundida y fondo", (t) => {
    for (const s of SUPERFICIES) expect(par(t, s)).toBeGreaterThanOrEqual(4.5);
  });
  it("texto-tenue (inactivo y glifo de orden): >= 4,5:1 sobre superficie y >= 3:1 sobre cualquier superficie", () => {
    expect(par("texto-tenue", "superficie")).toBeGreaterThanOrEqual(4.5);
    for (const s of [...SUPERFICIES, "hundida-2"]) expect(par("texto-tenue", s)).toBeGreaterThanOrEqual(3);
  });
  it("componentes de interfaz: borde de control, foco, acento y barra de error >= 3:1 sobre la superficie", () => {
    for (const t of ["borde-control", "foco", "acento", "error-barra", "otros"]) expect(par(t, "superficie")).toBeGreaterThanOrEqual(3);
    expect(par("borde-control", "hundida")).toBeGreaterThanOrEqual(3);
    expect(par("foco", "fondo")).toBeGreaterThanOrEqual(3);
  });
  it("boton activo: texto sobre acento >= 4,5:1", () => {
    expect(par("sobre-acento", "acento-fondo")).toBeGreaterThanOrEqual(4.5);
  });
  it.each(["ok", "atencion", "error", "pendiente"])("estado %s: texto >= 4,5:1 sobre su fondo y sobre la superficie", (e) => {
    expect(par(e, `${e}-fondo`)).toBeGreaterThanOrEqual(4.5);
    expect(par(e, "superficie")).toBeGreaterThanOrEqual(4.5);
  });
  it.each([1, 2, 3, 4, 5, 6])("serie viz-%i: >= 3:1 sobre la superficie y numero de la leyenda >= 4,5:1 encima", (n) => {
    expect(par(`viz-${n}`, "superficie")).toBeGreaterThanOrEqual(3);
    expect(par("sobre-serie", `viz-${n}`)).toBeGreaterThanOrEqual(4.5);
  });
  it("categoria 'otros' del donut: numero de la leyenda >= 4,5:1", () => {
    expect(par("sobre-serie", "otros")).toBeGreaterThanOrEqual(4.5);
  });
  it.each([0, 1, 2, 3, 4])("mapa de calor nivel %i: texto >= 4,5:1 sobre su fondo", (n) => {
    expect(par(`calor-texto-${n}`, `calor-${n}`)).toBeGreaterThanOrEqual(4.5);
  });
  it("el mapa de calor sube de nivel a nivel (cada fondo se distingue del anterior)", () => {
    for (let n = 1; n <= 4; n++) expect(par(`calor-${n}`, `calor-${n - 1}`)).toBeGreaterThan(1.1);
  });
  it(`${nombre}: no hay dos estados con el mismo color de texto`, () => {
    const t = ["ok", "atencion", "error", "pendiente"].map((e) => hex(tema, `kit-${e}`));
    expect(new Set(t).size).toBe(4);
  });
});

describe("compatibilidad con los componentes base de Forge compuestos por el kit", () => {
  const extraClaro: Decls = COMPAT_CLARO;
  const extraOscuro: Decls = COMPAT_OSCURO;

  it("claro: forgeGray-400 (glifo '↕' del DataTable, inactivos) deja de ser 2,96:1", () => {
    const g400 = resolver("var(--forge-gray-400, #8c97a6)", CLARO, extraClaro);
    expect(g400).not.toBe("#8c97a6");
    expect(contraste(g400, "#ffffff")).toBeGreaterThanOrEqual(3);
    expect(contraste("#8c97a6", "#ffffff")).toBeLessThan(3); // el valor de Forge que se corrige
  });
  it.each(["gray-400", "gray-500", "gray-600", "gray-700", "gray-800", "brand-600", "brand-700", "success-700", "warning-700", "danger-700"])(
    "oscuro: --forge-%s remapeada legible (>= 4,5:1; el glifo gray-400 >= 3:1) sobre tarjeta y fondo hundido",
    (n) => {
      const fg = hex(OSCURO, `forge-${n}`, extraOscuro);
      const minimo = n === "gray-400" ? 3 : 4.5;
      expect(contraste(fg, hex(OSCURO, "forge-surface-card", extraOscuro))).toBeGreaterThanOrEqual(minimo);
      expect(contraste(fg, hex(OSCURO, "forge-surface-sunken", extraOscuro))).toBeGreaterThanOrEqual(minimo);
    }
  );
  it("oscuro: el borde de Forge (gray-200) se ve sobre la tarjeta y la superficie hundida es mas oscura", () => {
    expect(luminancia(hex(OSCURO, "forge-surface-sunken", extraOscuro))).toBeLessThan(luminancia(hex(OSCURO, "forge-surface-card", extraOscuro)));
    expect(contraste(hex(OSCURO, "forge-gray-200", extraOscuro), hex(OSCURO, "forge-surface-card", extraOscuro))).toBeGreaterThan(1.05);
  });
  it("la compatibilidad solo vive dentro de .kit-tema (no toca a Forge fuera del kit)", () => {
    const fuera = [...R.keys()].filter((s) => Object.keys(R.get(s) ?? {}).some((k) => k.startsWith("--forge-")));
    for (const s of fuera) expect(s).toMatch(/\.kit-tema/);
  });
});
