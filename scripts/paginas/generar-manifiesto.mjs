#!/usr/bin/env node
/**
 * Manifiesto de páginas del dashboard ("nada se pierde").
 *
 * Cada app/**\/page.tsx debe estar clasificada en lib/paginas/manifiesto.json en una de estas categorías:
 *   menu | enlazada | redirigida | oculta | pendiente-revision
 *
 * Uso (desde la raíz del repo):
 *   node scripts/paginas/generar-manifiesto.mjs            informe: qué se clasifica solo y qué queda sin clasificar
 *   node scripts/paginas/generar-manifiesto.mjs --check    falla (exit 1) si hay páginas nuevas sin clasificar
 *                                                          o entradas de rutas que ya no existen
 *   node scripts/paginas/generar-manifiesto.mjs --write    regenera las entradas automáticas (origen "auto") y
 *                                                          CONSERVA las manuales (origen "manual"); lista las que
 *                                                          siguen sin clasificar para resolverlas a mano
 *   node scripts/paginas/generar-manifiesto.mjs --sugerir  como el informe, con posibles orígenes de enlace
 *
 * Qué clasifica solo: menú (lib/navigation.ts y menús propios de cada core), redirigidas (next.config.js o
 * redirect() puro en la página), RUTAS_OCULTAS, páginas de desarrollo (_design / preview / components / testing).
 * Todo lo demás se resuelve a mano en el JSON (origen "manual"). El test tests/nav/manifiesto-paginas.test.ts
 * vuelve a comprobar cada entrada contra el código real y no se fía de este script.
 */
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath, pathToFileURL } from "node:url";

const require = createRequire(import.meta.url);
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const MANIFIESTO = path.join(ROOT, "lib", "paginas", "manifiesto.json");
const args = new Set(process.argv.slice(2));
export const raiz = ROOT;

// ── Descubrimiento de páginas ─────────────────────────────────────────────────────────────────────

function recorrer(dir, salida) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (e.name === "node_modules" || e.name === ".next") continue;
      recorrer(p, salida);
    } else if (e.name === "page.tsx") salida.push(p);
  }
  return salida;
}

/** app/(forge)/credit-hub/bank-v2/page.tsx -> /credit-hub/bank-v2 (los grupos (x) no son parte de la URL). */
export function rutaDe(archivoRel) {
  const segs = archivoRel.split("/").slice(1, -1).filter((s) => !/^\(.*\)$/.test(s));
  return "/" + segs.join("/");
}

export function descubrirPaginas() {
  return recorrer(path.join(ROOT, "app"), [])
    .map((p) => path.relative(ROOT, p).split(path.sep).join("/"))
    .sort()
    .map((archivo) => ({ archivo, ruta: rutaDe(archivo) }));
}

const leer = (rel) => fs.readFileSync(path.join(ROOT, rel), "utf8");

// ── Módulo ────────────────────────────────────────────────────────────────────────────────────────

const MARKETING = [
  "/marketing", "/marketing-hub", "/workflows", "/automations", "/autopilot", "/ame", "/email", "/advertising",
  "/social", "/campaigns", "/content", "/library", "/ai-studio", "/leads", "/segments", "/audiences", "/analytics",
  "/intelligence", "/competitor-research",
];
const PORTAL_PUBLICO = ["/autos/vehiculos", "/autos/vehiculo", "/autos/cart", "/autos/compare", "/autos/mi-shopper", "/autos/dashboard", "/autos/marketplace"];
const bajo = (ruta, pre) => ruta === pre || ruta.startsWith(pre + "/");

export function moduloDe(ruta) {
  if (ruta === "/") return "suite";
  if (["/login", "/logout", "/registro", "/activacion", "/consent", "/m", "/offline"].some((p) => bajo(ruta, p))) return "publica";
  if (ruta === "/autos" || PORTAL_PUBLICO.some((p) => bajo(ruta, p))) return "publica";
  if (bajo(ruta, "/autos") || bajo(ruta, "/centro-operativo")) return "concesionarios";
  if (bajo(ruta, "/credit-hub/admin")) return "administracion";
  if (["/credit", "/credit-hub", "/bank", "/workflow-real", "/sic", "/market-intel", "/credit-agents", "/decision", "/compliance", "/institutions"].some((p) => bajo(ruta, p))) return "credito";
  if (MARKETING.some((p) => bajo(ruta, p))) return "marketing";
  if (bajo(ruta, "/contable")) return "contabilidad";
  if (bajo(ruta, "/legal") || bajo(ruta, "/legal-hub")) return "legal";
  if (bajo(ruta, "/proyectos")) return "proyectos";
  if (bajo(ruta, "/realtor")) return "real-estate";
  if (["/admin", "/settings", "/billing", "/audit", "/feature-flags", "/cockpit", "/tenants", "/tenant-onboarding", "/onboarding"].some((p) => bajo(ruta, p))) return "administracion";
  if (["/notifications", "/nauta", "/dashboard", "/agents", "/reports", "/scheduler", "/orchestration", "/execute", "/export", "/testing", "/[core]"].some((p) => bajo(ruta, p))) return "suite";
  return "otro";
}

// ── Fuentes de menú ───────────────────────────────────────────────────────────────────────────────

const hrefsDe = (texto) => [...texto.matchAll(/href:\s*"(\/[^"?#]*)[^"]*"/g)].map((m) => m[1]);
const tramo = (texto, desde, hasta) => {
  const a = texto.indexOf(desde);
  const b = texto.indexOf(hasta, a);
  return texto.slice(a, b === -1 ? undefined : b);
};

/** Menús propios que arman el href con una base + slug: [fuente, archivo, base de la ruta, regex del slug]. */
const FUENTES_SLUG = [
  ["proyectos-pestanas", "components/proyectos/ProyectosWorkspaceNav.tsx", "/proyectos/[id]/", /slug:\s*"([^"]*)"/g],
  ["proyectos-finanzas", "components/proyectos/finanzas/FinanzasSubNav.tsx", "/proyectos/[id]/finanzas/", /slug:\s*"([^"]*)"/g],
  ["legal-expediente", "components/legal/cases/CaseDetailHeader.tsx", "/legal/cases/[id]/", /href:\s*`\$\{base\}\/([a-z-]+)`/g],
];

/** Devuelve Map<href, fuente>. La primera fuente que lo nombra gana. */
export function fuentesDeMenu() {
  const m = new Map();
  const add = (fuente, hrefs) => hrefs.forEach((h) => { if (!m.has(h)) m.set(h, fuente); });
  const nav = leer("lib/navigation.ts");
  add("marketing-pestanas", hrefsDe(tramo(nav, "export const PESTANAS_MARKETING", "export const PREFIJOS_MARKETING")));
  add("navegacion", hrefsDe(tramo(nav, "export const NAVEGACION", "export type RutaOculta")));
  add("dealer-nav", hrefsDe(leer("components/dealer-management/shell/dealer-nav.ts")));
  const v2 = leer("app/(forge)/credit-hub/bank-v2/_nav.ts");
  const raiz = v2.match(/BANCO_V2_RAIZ\s*=\s*"([^"]+)"/)[1];
  add("bank-v2", [raiz, ...[...v2.matchAll(/href:\s*`\$\{BANCO_V2_RAIZ\}([^`]*)`/g)].map((x) => raiz + x[1])]);
  const rea = [leer("lib/realtor/centers.ts"), ...fs.readdirSync(path.join(ROOT, "lib/realtor")).filter((d) => fs.existsSync(path.join(ROOT, "lib/realtor", d, "center.ts"))).map((d) => leer(`lib/realtor/${d}/center.ts`))].join("\n");
  add("realtor", [...rea.matchAll(/href:\s*"(\/realtor[^"]*)"/g)].map((x) => x[1]));
  add("legal-subnav", hrefsDe(leer("components/legal/LegalSubNav.tsx")));
  add("cockpit-finanzas", hrefsDe(leer("components/cockpit/finance/FinanceSubNav.tsx")));
  const cont = leer("components/contable/ContableSubNav.tsx");
  add("contable-subnav", [...cont.matchAll(/slug:\s*"([^"]+)"/g)].map((x) => "/contable/" + x[1]));
  // Menús propios de cada core (los que monta su layout/shell). Las que se arman con plantillas se leen por su slug.
  const bank = tramo(leer("lib/credit-hub/bank/bankFormat.ts"), "export const BANK_NAV_ROUTES", "export function");
  add("bank-nav", [...bank.matchAll(/:\s*"(\/credit-hub\/bank[^"]*)"/g)].map((x) => x[1]));
  add("credit-hub-sidebar", hrefsDe(leer("components/forge/layout/ForgeCreditHubSidebar.tsx")));
  add("monetizacion-nav", hrefsDe(leer("components/credit-hub/monetizacion/shell/nav-routes.ts")));
  add("cockpit-sidebar", [...leer("components/cockpit/CockpitSidebar.tsx").matchAll(/href="(\/cockpit[^"]*)"/g)].map((x) => x[1]));
  add("sic-barra", [...leer("components/sic/SicBarraInstitucional.tsx").matchAll(/href="(\/sic[^"]*)"/g)].map((x) => x[1]));
  add("legal-investigacion", hrefsDe(leer("components/legal/research/papel-blanco/ResearchSidebar.tsx")));
  for (const [fuente, archivo, base, re] of FUENTES_SLUG) {
    add(fuente, [...leer(archivo).matchAll(re)].filter((x) => x[1]).map((x) => base + x[1]));
  }
  return m;
}

// ── RUTAS_OCULTAS ─────────────────────────────────────────────────────────────────────────────────

function rutasOcultas() {
  const t = tramo(leer("lib/navigation.ts"), "export const RUTAS_OCULTAS", "function sinQuery");
  return [...t.matchAll(/ruta:\s*"([^"]+)",\s*motivo:\s*"([^"]+)"(?:,\s*vigente:\s*"([^"]+)")?/g)].map((m) => ({ ruta: m[1], motivo: m[2], vigente: m[3] }));
}
const cubreOculta = (prefijo, ruta) => {
  const pat = prefijo.split("/");
  const r = ruta.split("/");
  return pat.length <= r.length && pat.every((s, i) => /^\[.+\]$/.test(s) || s === r[i]);
};

// ── Redirecciones ─────────────────────────────────────────────────────────────────────────────────

async function reglasNextConfig() {
  process.env.NEXT_PUBLIC_BACKEND_URL ||= "http://backend.invalid";
  const cfg = require(path.join(ROOT, "next.config.js"));
  return (await cfg.redirects()).filter((r) => !r.has && !r.missing);
}

const aMuestra = (ruta) => ruta.replace(/\[\.\.\.[^\]]+\]|\[\[\.\.\.[^\]]+\]\]/g, "x/y").replace(/\[[^\]]+\]/g, "x");

/** La página es una redirección pura: pocas líneas y un redirect() con destino literal. */
function redireccionDePagina(archivo) {
  const src = leer(archivo);
  if (src.split("\n").length > 15) return null;
  const m = src.match(/\b(?:permanentRedirect|redirect)\(\s*(["'`])(.*?)\1/s);
  return m ? m[2].replace(/\$\{[^}]*\}/g, "[x]") : null;
}

function existePagina(destino, rutas) {
  const d = destino.split(/[?#]/)[0];
  return rutas.some((r) => {
    const re = new RegExp("^" + r.replace(/\[[^\]]+\]/g, "[^/]+").replace(/\//g, "\\/") + "$");
    return re.test(d.replace(/\[x\]/g, "x"));
  });
}

// ── Sugerencias de enlace ─────────────────────────────────────────────────────────────────────────

export function corpus() {
  const salida = [];
  const visitar = (dir) => {
    for (const e of fs.readdirSync(path.join(ROOT, dir), { withFileTypes: true })) {
      const rel = dir + "/" + e.name;
      if (e.isDirectory()) {
        if (["node_modules", ".next", "tests", "__tests__", "paginas", "legacy"].includes(e.name)) continue;
        visitar(rel);
      } else if (/\.(tsx?|jsx?)$/.test(e.name) && !/\.(test|spec)\./.test(e.name)) salida.push(rel);
    }
  };
  ["app", "components", "lib", "hooks", "contexts", "utils", "config"].forEach((d) => fs.existsSync(path.join(ROOT, d)) && visitar(d));
  return salida.map((rel) => ({ rel, lineas: leer(rel).split("\n") }));
}

/** Ficheros que nombran rutas pero no se montan (nadie los importa) o no son enlaces: no valen como origen. */
export const ORIGENES_NO_VALIDOS = [
  "lib/navigation.ts", // fuente del menú, no un enlace entre pantallas
  "components/layout/Sidebar.tsx", "components/layout/Sidebar.backup.tsx", "components/forge/layout/ForgeAppSidebar.tsx", // barras antiguas sin montar
  "components/ui/HelpCenter.tsx", "components/credit-hub/bank/navigation/BankSideNav.tsx", "components/credit-hub/navigation/DealerBottomNav.tsx",
  "components/sic/SicBarraContexto.tsx", "lib/autos-portal/routes.ts",
];

const CONTEXTO = /href|\.push\(|\.replace\(|<Link|redirect|navigate|location|\bto\b\s*[=:]|\burl\b|\bpath\b|\broute\b/i;

export function patronEnlace(ruta) {
  const cuerpo = ruta
    .split("/")
    .map((s) => (/^\[.+\]$/.test(s) ? "(?:\\$\\{[^}]*\\}|[^/\"'`?#\\s]+)" : s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")))
    .join("/");
  return new RegExp("[\"'`]" + cuerpo + "/?(?:[?#\"'`]|$)");
}

/** Para rutas dinámicas con cola estática (…/[id]/deadlines): también vale `${base}/deadlines`. */
export function patronCola(ruta) {
  const segs = ruta.split("/");
  const i = segs.map((s) => /^\[.+\]$/.test(s)).lastIndexOf(true);
  if (i === -1 || i === segs.length - 1) return null;
  const cola = segs.slice(i + 1).join("/");
  return new RegExp("\\$\\{[^}]*\\}/" + cola.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "(?:[?#\"'`]|$)");
}

export function origenes(ruta, archivoPropio, cp, max = 3) {
  if (ruta === "/") return [];
  const re = patronEnlace(ruta);
  const reCola = patronCola(ruta);
  const salida = [];
  for (const f of cp) {
    if (f.rel === archivoPropio || ORIGENES_NO_VALIDOS.includes(f.rel) || /\.(bak|backup)/.test(f.rel)) continue;
    for (let i = 0; i < f.lineas.length; i++) {
      if (!re.test(f.lineas[i]) && !(reCola && reCola.test(f.lineas[i]))) continue;
      const ventana = f.lineas.slice(Math.max(0, i - 2), i + 1).join(" ");
      if (CONTEXTO.test(ventana)) { salida.push({ archivo: f.rel, linea: i + 1, texto: f.lineas[i].trim().slice(0, 110) }); break; }
    }
    if (salida.length >= max) break;
  }
  return salida;
}

// ── Clasificación automática ──────────────────────────────────────────────────────────────────────

const DEV = (ruta) => ruta.split("/").some((s) => s.startsWith("_") || ["preview", "components", "testing"].includes(s));

export async function clasificarAuto(paginas) {
  const rutas = paginas.map((p) => p.ruta);
  const menu = fuentesDeMenu();
  const ocultas = rutasOcultas();
  const reglas = await reglasNextConfig();
  const { match } = require("next/dist/compiled/path-to-regexp");
  const matchers = reglas.map((r) => ({ r, fn: match(r.source, { decode: decodeURIComponent }) }));
  // Único menú propio que sigue mostrando páginas de un prefijo de RUTAS_OCULTAS (bank-v2 está oculto del menú global, no de su banco).
  const FUENTES_PROPIAS = new Set(["bank-v2"]);
  const auto = [];
  const sin = [];
  for (const p of paginas) {
    const base = { ruta: p.ruta, archivo: p.archivo, modulo: moduloDe(p.ruta), origen: "auto" };
    const muestra = aMuestra(p.ruta);
    // 1. redirigida por next.config.js
    const hit = matchers.find(({ fn }) => fn(muestra));
    if (hit) {
      const destino = hit.r.destination.replace(/:[A-Za-z]+\*?/g, "[x]");
      if (existePagina(destino, rutas)) {
        auto.push({ ...base, categoria: "redirigida", via: "next.config", destino: hit.r.destination, cubre: "sin-verificar",
          motivo: `next.config.js redirige ${hit.r.source} a ${hit.r.destination}`,
          evidencia: `next.config.js redirects(): source ${hit.r.source}` });
        continue;
      }
    }
    // 2. redirigida por la propia página
    const rp = redireccionDePagina(p.archivo);
    if (rp && existePagina(rp, rutas)) {
      auto.push({ ...base, categoria: "redirigida", via: "pagina", destino: rp, cubre: "completa",
        verificacion: "solo redirect: la página no tiene interfaz ni funciones propias (menos de 15 líneas, solo redirect())",
        motivo: `la página hace redirect() a ${rp}`, evidencia: `${p.archivo}: redirect("${rp}")` });
      continue;
    }
    // 3. menú
    const fuente = menu.get(p.ruta);
    const oc = ocultas.find((o) => cubreOculta(o.ruta, p.ruta));
    if (fuente && (!oc || FUENTES_PROPIAS.has(fuente))) {
      auto.push({ ...base, categoria: "menu", fuente, href: p.ruta,
        motivo: `está en el menú (${fuente})`, evidencia: `href "${p.ruta}" en la fuente ${fuente}` });
      continue;
    }
    // 4. RUTAS_OCULTAS
    if (oc) {
      auto.push({ ...base, categoria: "oculta", tipo: /desarrollo|maqueta|vista previa|laboratorio|catálogo/.test(oc.motivo) ? "desarrollo" : "copia-sin-enlace",
        rutasOcultas: true, motivo: oc.motivo, vigente: oc.vigente, evidencia: `RUTAS_OCULTAS en lib/navigation.ts: ${oc.ruta}` });
      continue;
    }
    // 5. desarrollo por nombre
    if (DEV(p.ruta)) {
      auto.push({ ...base, categoria: "oculta", tipo: "desarrollo", motivo: "página de diseño/vista previa/componentes de desarrollo", evidencia: `segmento de desarrollo en la ruta ${p.ruta}` });
      continue;
    }
    sin.push(p);
  }
  return { auto, sin };
}

// ── Principal ─────────────────────────────────────────────────────────────────────────────────────

function cargarManifiesto() {
  return fs.existsSync(MANIFIESTO) ? JSON.parse(fs.readFileSync(MANIFIESTO, "utf8")) : { paginas: [] };
}

export function escribir(paginas) {
  const orden = paginas.slice().sort((a, b) => (a.ruta < b.ruta ? -1 : a.ruta > b.ruta ? 1 : 0));
  const cuerpo = orden.map((e) => "    " + JSON.stringify(e)).join(",\n");
  const cab = `{\n  "_aviso": "Generado y mantenido con scripts/paginas/generar-manifiesto.mjs (--write conserva las entradas con origen manual). Lo verifica tests/nav/manifiesto-paginas.test.ts.",\n  "paginas": [\n`;
  fs.mkdirSync(path.dirname(MANIFIESTO), { recursive: true });
  fs.writeFileSync(MANIFIESTO, cab + cuerpo + "\n  ]\n}\n");
}

async function principal() {
  const paginas = descubrirPaginas();
  const { auto } = await clasificarAuto(paginas);
  const previo = cargarManifiesto().paginas;
  const existentes = new Set(paginas.map((p) => p.ruta));
  const manuales = previo.filter((e) => e.origen === "manual");
  const manualesVivas = manuales.filter((e) => existentes.has(e.ruta));
  const manualesMuertas = manuales.filter((e) => !existentes.has(e.ruta));
  const rutasManuales = new Set(manualesVivas.map((e) => e.ruta));
  const rutasAuto = new Set(auto.map((e) => e.ruta));
  // Una entrada manual sobre una ruta que ahora se clasifica sola queda como manual (gana).
  const sinClasificar = paginas.filter((p) => !rutasAuto.has(p.ruta) && !rutasManuales.has(p.ruta));
  const autoMuertas = previo.filter((e) => e.origen !== "manual" && !existentes.has(e.ruta));

  const porCat = {};
  for (const e of [...auto.filter((e) => !rutasManuales.has(e.ruta)), ...manualesVivas]) porCat[e.categoria] = (porCat[e.categoria] || 0) + 1;

  console.log(`Páginas (find app -name page.tsx): ${paginas.length}`);
  console.log(`Clasificadas solas: ${auto.length} | manuales vivas: ${manualesVivas.length} | sin clasificar: ${sinClasificar.length}`);
  console.log("Por categoría:", JSON.stringify(porCat));
  if (manualesMuertas.length || autoMuertas.length) {
    console.log(`\nEntradas de rutas que YA NO EXISTEN (${manualesMuertas.length + autoMuertas.length}):`);
    [...manualesMuertas, ...autoMuertas].forEach((e) => console.log("  - " + e.ruta));
  }
  if (sinClasificar.length) {
    const cp = args.has("--sugerir") ? corpus() : null;
    console.log(`\nSIN CLASIFICAR (${sinClasificar.length}):`);
    for (const p of sinClasificar) {
      console.log(`  - ${p.ruta}  [${moduloDe(p.ruta)}]  (${p.archivo})`);
      if (cp) origenes(p.ruta, p.archivo, cp).forEach((o) => console.log(`        <- ${o.archivo}:${o.linea}  ${o.texto}`));
    }
  }

  if (args.has("--write")) {
    const finales = [...auto.filter((e) => !rutasManuales.has(e.ruta)), ...manualesVivas];
    escribir(finales);
    console.log(`\nEscrito ${path.relative(ROOT, MANIFIESTO)} con ${finales.length} entradas.`);
    if (sinClasificar.length) {
      console.log("Quedan páginas sin clasificar: añade su entrada manual (origen \"manual\") en el JSON y vuelve a ejecutar --check.");
    }
  }
  if (args.has("--check")) {
    const falla = sinClasificar.length > 0 || manualesMuertas.length > 0 || autoMuertas.length > 0;
    if (falla) {
      console.error("\nEl manifiesto no está al día. Ejecuta --write y clasifica a mano lo que quede sin clasificar.");
      process.exit(1);
    }
    console.log("\nOK: todas las páginas están clasificadas.");
  }

}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) await principal();
