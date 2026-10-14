/** @jest-environment node */
/**
 * Regla "nada se pierde": cada app/** /page.tsx está clasificada en lib/paginas/manifiesto.json.
 *
 * No se fía del manifiesto: relee app/, lib/navigation.ts, los menús propios de cada core, next.config.js, el
 * middleware y los ficheros origen. Falla si hay una página sin clasificar, una entrada de una ruta que ya no existe
 * o una entrada que no cumple lo que declara.
 *
 * Ejecutar:  NEXT_PUBLIC_BACKEND_URL=http://backend.invalid npx jest tests/nav/manifiesto-paginas.test.ts
 * Actualizar: node scripts/paginas/generar-manifiesto.mjs --check | --write   (docs/dashboard/MANIFIESTO_PAGINAS.md)
 */
import fs from "fs";
import path from "path";
import { DEALER_NAV_GROUPS } from "@/components/dealer-management/shell/dealer-nav";
import { BANCO_V2_NAV } from "@/app/(forge)/credit-hub/bank-v2/_nav";
import { NAVEGACION, PESTANAS_MARKETING, RUTAS_OCULTAS, esRutaOculta } from "@/lib/navigation";
import { CAREER_DIRECTOR, REALTOR_CENTERS, SMART_CALENDAR } from "@/lib/realtor/centers";
import { MANIFIESTO_PAGINAS } from "@/lib/paginas/manifiesto";
import {
  CATEGORIAS, MODULOS, type Comprobacion, type EntradaEnlazada, type EntradaPagina, type EntradaRedirigida,
} from "@/lib/paginas/tipos";

const RAIZ = path.resolve(__dirname, "..", "..");

/**
 * Tope de páginas en `pendiente-revision`. Solo puede bajar: si resuelves una, baja la cifra; si necesitas subirla,
 * es una decisión que César ve en el diff.
 */
const MAXIMO_PENDIENTES = 50;

// ── Utilidades ────────────────────────────────────────────────────────────────────────────────────

const leer = (rel: string): string => fs.readFileSync(path.join(RAIZ, rel), "utf8");
const existe = (rel: string): boolean => fs.existsSync(path.join(RAIZ, rel));
const lista = (v: string | string[] | undefined): string[] => (v === undefined ? [] : Array.isArray(v) ? v : [v]);

function paginasDeApp(): { archivo: string; ruta: string }[] {
  const salida: string[] = [];
  const recorrer = (dir: string) => {
    for (const e of fs.readdirSync(path.join(RAIZ, dir), { withFileTypes: true })) {
      const rel = `${dir}/${e.name}`;
      if (e.isDirectory()) {
        if (e.name !== "node_modules" && e.name !== ".next") recorrer(rel);
      } else if (e.name === "page.tsx") salida.push(rel);
    }
  };
  recorrer("app");
  return salida.sort().map((archivo) => ({
    archivo,
    ruta: "/" + archivo.split("/").slice(1, -1).filter((s) => !/^\(.*\)$/.test(s)).join("/"),
  }));
}

const esDinamico = (s: string) => /^\[.+\]$/.test(s);
/** /credit/[id] -> /credit/x, para probar reglas de redirección. */
const aMuestra = (ruta: string) => ruta.replace(/\[\.\.\.[^\]]+\]|\[\[\.\.\.[^\]]+\]\]/g, "x/y").replace(/\[[^\]]+\]/g, "x");

function coincideConPagina(destino: string, rutas: string[]): boolean {
  const d = destino.split(/[?#]/)[0]!.replace(/\[x\]/g, "x");
  return rutas.some((r) => new RegExp("^" + r.replace(/\[[^\]]+\]/g, "[^/]+").replace(/\//g, "\\/") + "$").test(d));
}

// ── Menús reales ──────────────────────────────────────────────────────────────────────────────────

const sinQuery = (h: string) => h.split(/[?#]/)[0]!;

/** Fuentes importables: se leen del código, no del manifiesto. */
function hrefsImportables(): Record<string, Set<string>> {
  const nav = new Set<string>();
  for (const s of NAVEGACION) {
    if (s.href) nav.add(sinQuery(s.href));
    for (const c of s.children) if (c.href) nav.add(sinQuery(c.href));
  }
  const pestanas = new Set<string>();
  for (const p of PESTANAS_MARKETING) {
    pestanas.add(p.href);
    p.paginas.forEach((x) => pestanas.add(sinQuery(x.href)));
  }
  const v2 = new Set<string>(BANCO_V2_NAV.flatMap((g) => g.items.map((i) => sinQuery(i.href))));
  const dealer = new Set<string>(DEALER_NAV_GROUPS.flatMap((g) => g.items.map((i) => sinQuery(i.href))));
  const realtor = new Set<string>(
    [...REALTOR_CENTERS, CAREER_DIRECTOR, SMART_CALENDAR].map((c) => c.href).filter((h): h is string => !!h),
  );
  return { navegacion: nav, "marketing-pestanas": pestanas, "bank-v2": v2, "dealer-nav": dealer, realtor };
}

/**
 * Menús propios que viven dentro de un componente: se comprueba que el fichero nombra la ruta.
 * `href`: la ruta aparece literal entre comillas. `slug`: base + slug (`slug: "x"`). `plantilla`: `${base}/x`.
 */
const FUENTES_TEXTO: Record<string, { archivo: string; modo: "href" | "slug" | "plantilla"; base?: string }> = {
  "legal-subnav": { archivo: "components/legal/LegalSubNav.tsx", modo: "href" },
  "legal-investigacion": { archivo: "components/legal/research/papel-blanco/ResearchSidebar.tsx", modo: "href" },
  "legal-expediente": { archivo: "components/legal/cases/CaseDetailHeader.tsx", modo: "plantilla", base: "/legal/cases/[id]/" },
  "cockpit-finanzas": { archivo: "components/cockpit/finance/FinanceSubNav.tsx", modo: "href" },
  "cockpit-sidebar": { archivo: "components/cockpit/CockpitSidebar.tsx", modo: "href" },
  "contable-subnav": { archivo: "components/contable/ContableSubNav.tsx", modo: "slug", base: "/contable/" },
  "bank-nav": { archivo: "lib/credit-hub/bank/bankFormat.ts", modo: "href" },
  "credit-hub-sidebar": { archivo: "components/forge/layout/ForgeCreditHubSidebar.tsx", modo: "href" },
  "monetizacion-nav": { archivo: "components/credit-hub/monetizacion/shell/nav-routes.ts", modo: "href" },
  "sic-barra": { archivo: "components/sic/SicBarraInstitucional.tsx", modo: "href" },
  "proyectos-pestanas": { archivo: "components/proyectos/ProyectosWorkspaceNav.tsx", modo: "slug", base: "/proyectos/[id]/" },
  "proyectos-finanzas": { archivo: "components/proyectos/finanzas/FinanzasSubNav.tsx", modo: "slug", base: "/proyectos/[id]/finanzas/" },
};

function menuTextoContiene(fuente: string, href: string): boolean {
  const f = FUENTES_TEXTO[fuente];
  if (!f || !existe(f.archivo)) return false;
  const texto = leer(f.archivo);
  if (f.modo === "href") return texto.includes(`"${href}"`) || texto.includes(`"${href}?`);
  if (!f.base || !href.startsWith(f.base)) return false;
  const cola = href.slice(f.base.length);
  return f.modo === "slug" ? texto.includes(`slug: "${cola}"`) : texto.includes("${base}/" + cola);
}

// ── Enlaces entre pantallas ───────────────────────────────────────────────────────────────────────

/** Ficheros que nombran rutas pero no cuentan como enlace (la fuente del menú) o no se montan (nadie los importa). */
const ORIGENES_NO_VALIDOS = [
  "lib/navigation.ts",
  "components/layout/Sidebar.tsx", "components/layout/Sidebar.backup.tsx", "components/forge/layout/ForgeAppSidebar.tsx",
  "components/ui/HelpCenter.tsx", "components/credit-hub/bank/navigation/BankSideNav.tsx",
  "components/credit-hub/navigation/DealerBottomNav.tsx", "components/sic/SicBarraContexto.tsx", "lib/autos-portal/routes.ts",
];
const CONTEXTO = /href|\.push\(|\.replace\(|<Link|redirect|navigate|location|\bto\b\s*[=:]|\burl\b|\bpath\b|\broute\b/i;

const escapar = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** Patrón de la ruta como literal; un [param] vale por `${...}` o por cualquier segmento. */
function patronRuta(ruta: string): RegExp {
  const cuerpo = ruta.split("/").map((s) => (esDinamico(s) ? "(?:\\$\\{[^}]*\\}|[^/\"'`?#\\s]+)" : escapar(s))).join("/");
  return new RegExp("[\"'`]" + cuerpo + "/?(?:[?#\"'`]|$)");
}

/** …/[id]/deadlines también se enlaza como `${base}/deadlines`. */
function patronCola(ruta: string): RegExp | null {
  const segs = ruta.split("/");
  const i = segs.map(esDinamico).lastIndexOf(true);
  if (i === -1 || i === segs.length - 1) return null;
  return new RegExp("\\$\\{[^}]*\\}/" + escapar(segs.slice(i + 1).join("/")) + "(?:[?#\"'`]|$)");
}

function ficheroNombraRuta(archivo: string, ruta: string): boolean {
  const re = patronRuta(ruta);
  const cola = patronCola(ruta);
  const lineas = leer(archivo).split("\n");
  return lineas.some((l, i) => (re.test(l) || (cola?.test(l) ?? false)) && CONTEXTO.test(lineas.slice(Math.max(0, i - 2), i + 1).join(" ")));
}

function comprobar(c: Comprobacion): string | null {
  if (!existe(c.archivo)) return `${c.archivo} no existe`;
  const texto = leer(c.archivo);
  const falta = lista(c.contiene).filter((s) => !texto.includes(s));
  return falta.length ? `${c.archivo} no contiene: ${falta.map((f) => JSON.stringify(f)).join(", ")}` : null;
}

// ── Redirecciones ─────────────────────────────────────────────────────────────────────────────────

type Regla = { source: string; destination: string; has?: unknown; missing?: unknown };

async function reglasNextConfig(): Promise<Regla[]> {
  process.env.NEXT_PUBLIC_BACKEND_URL ||= "http://backend.invalid";
  const cfg = require(path.join(RAIZ, "next.config.js"));
  return ((await cfg.redirects()) as Regla[]).filter((r) => !r.has && !r.missing);
}

function destinoDeRedirectEnPagina(archivo: string): string | null {
  const src = leer(archivo);
  const m = src.match(/\b(?:permanentRedirect|redirect|router\.replace)\(\s*(["'`])(.*?)\1/s);
  return m ? m[2]!.replace(/\$\{[^}]*\}/g, "[x]") : null;
}

// ── Suite ─────────────────────────────────────────────────────────────────────────────────────────

const paginas = paginasDeApp();
const rutas = paginas.map((p) => p.ruta);
const porRuta = new Map<string, EntradaPagina>();
MANIFIESTO_PAGINAS.forEach((e) => porRuta.set(e.ruta, e));
const importables = hrefsImportables();

describe("manifiesto de páginas: nada se pierde", () => {
  it("cada page.tsx de app/ está clasificada y el manifiesto no lista rutas que ya no existen", () => {
    const sinClasificar = paginas.filter((p) => !porRuta.has(p.ruta)).map((p) => `${p.ruta}  (${p.archivo})`);
    const existentes = new Set(rutas);
    const fantasma = MANIFIESTO_PAGINAS.filter((e) => !existentes.has(e.ruta)).map((e) => e.ruta);
    const repetidas = MANIFIESTO_PAGINAS.map((e) => e.ruta).filter((r, i, a) => a.indexOf(r) !== i);
    const msg = [
      sinClasificar.length ? `SIN CLASIFICAR (${sinClasificar.length}):\n  ${sinClasificar.join("\n  ")}` : "",
      fantasma.length ? `RUTAS QUE YA NO EXISTEN (${fantasma.length}):\n  ${fantasma.join("\n  ")}` : "",
      repetidas.length ? `RUTAS REPETIDAS:\n  ${repetidas.join("\n  ")}` : "",
    ].filter(Boolean).join("\n");
    expect(msg === "" ? "ok" : `${msg}\n\nEjecuta: node scripts/paginas/generar-manifiesto.mjs --check (y --write)`).toBe("ok");
    expect(MANIFIESTO_PAGINAS).toHaveLength(paginas.length);
  });

  it("cada entrada declara fichero, módulo, categoría, motivo y evidencia coherentes", () => {
    const errores: string[] = [];
    for (const e of MANIFIESTO_PAGINAS) {
      const p = paginas.find((x) => x.ruta === e.ruta);
      if (!p) continue; // ya lo cuenta la prueba anterior
      if (e.archivo !== p.archivo) errores.push(`${e.ruta}: archivo ${e.archivo} != ${p.archivo}`);
      if (!(MODULOS as readonly string[]).includes(e.modulo)) errores.push(`${e.ruta}: módulo inválido ${e.modulo}`);
      if (!(CATEGORIAS as readonly string[]).includes(e.categoria)) errores.push(`${e.ruta}: categoría inválida ${e.categoria}`);
      if (!e.motivo?.trim()) errores.push(`${e.ruta}: motivo vacío`);
      if (!e.evidencia?.trim()) errores.push(`${e.ruta}: evidencia vacía`);
      if (e.modulo === "otro" && e.motivo.trim().length < 25) errores.push(`${e.ruta}: módulo "otro" sin motivo suficiente`);
      for (const c of e.comprobaciones ?? []) {
        const fallo = comprobar(c);
        if (fallo) errores.push(`${e.ruta}: comprobación falla: ${fallo}`);
      }
    }
    expect(errores).toEqual([]);
  });

  it("menu: el href está de verdad en lib/navigation.ts o en el menú propio de su core", () => {
    const errores: string[] = [];
    for (const e of MANIFIESTO_PAGINAS) {
      if (e.categoria !== "menu") continue;
      const enImportable = importables[e.fuente]?.has(e.href);
      const enTexto = !importables[e.fuente] && menuTextoContiene(e.fuente, e.href);
      if (e.href !== e.ruta) errores.push(`${e.ruta}: href ${e.href} distinto de la ruta`);
      if (!enImportable && !enTexto) errores.push(`${e.ruta}: "${e.href}" NO está en la fuente de menú "${e.fuente}"`);
    }
    expect(errores).toEqual([]);
  });

  it("redirigida: hay una regla (next.config.js / redirect() de la página / middleware) y el destino existe", async () => {
    const reglas = await reglasNextConfig();
    const { match } = require("next/dist/compiled/path-to-regexp");
    const errores: string[] = [];
    for (const e of MANIFIESTO_PAGINAS) {
      if (e.categoria !== "redirigida") continue;
      const r = e as EntradaRedirigida;
      if (!coincideConPagina(r.destino.replace(/:[A-Za-z]+\*?/g, "[x]"), rutas)) errores.push(`${e.ruta}: el destino ${r.destino} no existe como page.tsx`);
      if (r.destino.split(/[?#]/)[0] === e.ruta) errores.push(`${e.ruta}: se redirige a sí misma`);
      if (r.via === "next.config") {
        const regla = reglas.find((x) => match(x.source, { decode: decodeURIComponent })(aMuestra(e.ruta)));
        if (!regla) errores.push(`${e.ruta}: ninguna regla de next.config.js redirects() la cubre`);
        else if (regla.destination !== r.destino) errores.push(`${e.ruta}: la regla manda a ${regla.destination}, el manifiesto dice ${r.destino}`);
      } else if (r.via === "pagina") {
        const d = destinoDeRedirectEnPagina(e.archivo);
        if (!d) errores.push(`${e.ruta}: la página no tiene redirect()/router.replace() con destino literal`);
        else if (d.split(/[?#]/)[0] !== r.destino.split(/[?#]/)[0]) errores.push(`${e.ruta}: la página redirige a ${d}, el manifiesto dice ${r.destino}`);
      } else if (!e.comprobaciones?.length) {
        errores.push(`${e.ruta}: una redirección por middleware necesita comprobaciones sobre middleware.ts`);
      } else if (!e.comprobaciones.some((c) => c.archivo === "middleware.ts")) {
        errores.push(`${e.ruta}: falta una comprobación sobre middleware.ts`);
      }
      // Qué cubre la versión nueva: no se admite declarar más de lo que se comprobó.
      if (!["completa", "parcial", "sin-verificar"].includes(r.cubre)) errores.push(`${e.ruta}: cubre inválido ${r.cubre}`);
      if (r.cubre === "parcial" && !r.noCubre?.length) errores.push(`${e.ruta}: cubre=parcial exige noCubre (las funciones que NO cubre)`);
      if (r.cubre !== "parcial" && r.noCubre?.length) errores.push(`${e.ruta}: noCubre solo se admite con cubre=parcial`);
      if (r.cubre === "completa" && !r.verificacion?.trim()) errores.push(`${e.ruta}: cubre=completa exige verificacion`);
      if (r.cubre === "completa" && /solo redirect/.test(r.verificacion ?? "")) {
        // "Solo redirect": la página no tiene interfaz propia. Se comprueba que de verdad sea así.
        if (r.via !== "pagina" || leer(e.archivo).split("\n").length > 15) errores.push(`${e.ruta}: dice "solo redirect" pero la página tiene interfaz propia`);
      }
    }
    expect(errores).toEqual([]);
  });

  it("oculta: lleva motivo y, si es de RUTAS_OCULTAS, coincide (y al revés)", () => {
    const errores: string[] = [];
    for (const e of MANIFIESTO_PAGINAS) {
      if (e.categoria === "oculta") {
        if (!e.motivo.trim()) errores.push(`${e.ruta}: oculta sin motivo`);
        const cubierta = esRutaOculta(e.ruta);
        const de = RUTAS_OCULTAS.find((o) => {
          const pat = o.ruta.split("/");
          const r = e.ruta.split("/");
          return pat.length <= r.length && pat.every((s, i) => esDinamico(s) || s === r[i]);
        });
        if (e.rutasOcultas && !de) errores.push(`${e.ruta}: dice ser de RUTAS_OCULTAS y no lo es`);
        if (e.rutasOcultas && de && e.motivo !== de.motivo) errores.push(`${e.ruta}: el motivo no coincide con RUTAS_OCULTAS ("${de.motivo}")`);
        if (!e.rutasOcultas && cubierta) errores.push(`${e.ruta}: está en RUTAS_OCULTAS pero la entrada no lo declara (rutasOcultas: true)`);
        if (e.tipo === "admin" && !e.comprobaciones?.length) errores.push(`${e.ruta}: oculta de administradores sin comprobación del control de acceso`);
        if (e.tipo === "copia-sin-enlace" && !e.rutasOcultas && !e.comprobaciones?.length) errores.push(`${e.ruta}: copia sin enlace sin comprobación de su marca`);
      }
    }
    expect(errores).toEqual([]);
  });

  it("enlazada: el origen existe, es otro fichero y nombra la ruta como href/push/Link; el origen es alcanzable", () => {
    const errores: string[] = [];
    const enlazadas = MANIFIESTO_PAGINAS.filter((e): e is EntradaEnlazada => e.categoria === "enlazada");
    const valido = new Map<string, string[]>(); // ruta -> orígenes que sí nombran la ruta
    for (const e of enlazadas) {
      if (!e.desde?.length) { errores.push(`${e.ruta}: enlazada sin "desde" (hay que nombrar el origen)`); continue; }
      const buenos: string[] = [];
      for (const o of e.desde) {
        if (o.archivo === e.archivo) { errores.push(`${e.ruta}: el origen es la propia página`); continue; }
        if (ORIGENES_NO_VALIDOS.includes(o.archivo)) { errores.push(`${e.ruta}: ${o.archivo} no vale como origen (no se monta o no es un enlace)`); continue; }
        if (!existe(o.archivo)) { errores.push(`${e.ruta}: el origen ${o.archivo} no existe`); continue; }
        const ok = o.contiene
          ? lista(o.contiene).every((s) => leer(o.archivo).includes(s))
          : ficheroNombraRuta(o.archivo, e.ruta);
        if (ok) buenos.push(o.archivo);
        else errores.push(`${e.ruta}: ${o.archivo} no ${o.contiene ? "contiene lo declarado" : "enlaza la ruta"}`);
      }
      valido.set(e.ruta, buenos);
    }
    // Alcanzabilidad: una página solo enlazada desde pantallas inaccesibles (una isla) no está "accesible".
    const porArchivo = new Map(paginas.map((p) => [p.archivo, p.ruta]));
    const alcanzable = new Set<string>();
    for (const e of MANIFIESTO_PAGINAS) if (e.categoria === "menu") alcanzable.add(e.ruta);
    // Una página en un menú cuenta aunque sea un redirect: el menú la abre y el redirect sigue hasta su destino.
    const hrefsMenu = new Set(Object.values(importables).flatMap((s) => [...s]));
    for (const e of MANIFIESTO_PAGINAS) if (hrefsMenu.has(e.ruta)) alcanzable.add(e.ruta);
    let cambio = true;
    while (cambio) {
      cambio = false;
      for (const e of MANIFIESTO_PAGINAS) {
        if (alcanzable.has(e.ruta)) continue;
        if (e.categoria === "enlazada") {
          const ok = (valido.get(e.ruta) ?? []).some((a) => {
            const rutaOrigen = porArchivo.get(a);
            if (!rutaOrigen) return true; // un componente: se asume montado por una pantalla (límite documentado)
            const cat = porRuta.get(rutaOrigen)?.categoria;
            return alcanzable.has(rutaOrigen) && cat !== "oculta" && cat !== "pendiente-revision";
          });
          if (ok) { alcanzable.add(e.ruta); cambio = true; }
        }
      }
      // Destino de una redirección: alcanzable si lo es quien redirige.
      for (const e of MANIFIESTO_PAGINAS) {
        if (e.categoria !== "redirigida" || !alcanzable.has(e.ruta)) continue;
        const d = e.destino.split(/[?#]/)[0]!;
        const dest = MANIFIESTO_PAGINAS.find((x) => x.ruta === d || new RegExp("^" + x.ruta.replace(/\[[^\]]+\]/g, "[^/]+") + "$").test(d.replace(/\[x\]/g, "x")));
        if (dest && !alcanzable.has(dest.ruta) && dest.categoria === "enlazada") { alcanzable.add(dest.ruta); cambio = true; }
      }
    }
    for (const e of enlazadas) if (!alcanzable.has(e.ruta)) errores.push(`${e.ruta}: enlazada solo desde páginas sin acceso (isla): ${(e.desde ?? []).map((o) => o.archivo).join(", ")}`);
    expect(errores).toEqual([]);
  });

  it("pendiente-revision: se tolera, se cuenta y no puede crecer", () => {
    const pend = MANIFIESTO_PAGINAS.filter((e) => e.categoria === "pendiente-revision");
    // eslint-disable-next-line no-console
    console.info(`pendiente-revision: ${pend.length}\n  ${pend.map((e) => `${e.ruta} — ${e.motivo}`).join("\n  ")}`);
    expect(pend.filter((e) => !e.motivo.trim())).toEqual([]);
    expect(pend.length).toBeLessThanOrEqual(MAXIMO_PENDIENTES);
  });
});
