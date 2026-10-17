#!/usr/bin/env node
// Guard de CI (DB-CODEX-20): falla si hay console.log/info/debug en las rutas protegidas del Credit Hub.
// console.warn y console.error están permitidos. Uso: node scripts/ci/sin-console-credit-hub.mjs [raíz]
import { readdirSync, readFileSync, statSync, existsSync } from "node:fs";
import { join, relative, sep } from "node:path";

export const RUTAS_PROTEGIDAS = [
  "app/(forge)/credit-hub",
  "components/credit-hub",
  "components/forge/credit-hub",
  "lib/credit-hub",
];
const PREFIJOS_ARCHIVO = [{ dir: "hooks", prefijo: "useAuth" }];
const IGNORAR_DIR = new Set(["node_modules", ".next", "__tests__", "__mocks__", "tests"]);
const PATRON = /\bconsole\s*\.\s*(log|info|debug)\b/;

const esFuente = (n) =>
  /\.tsx?$/.test(n) && !/\.d\.ts$/.test(n) && !/\.(test|spec)\.tsx?$/.test(n) && !/\.mock\.tsx?$/.test(n);

function* recorrer(dir) {
  for (const nombre of readdirSync(dir)) {
    const ruta = join(dir, nombre);
    if (statSync(ruta).isDirectory()) {
      if (!IGNORAR_DIR.has(nombre)) yield* recorrer(ruta);
    } else if (esFuente(nombre)) yield ruta;
  }
}

/** Ignora comentarios de línea y de bloque (no analiza cadenas). */
function lineasInfractoras(texto) {
  const sinBloques = texto.replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, " "));
  return sinBloques
    .split(/\r?\n/)
    .map((l, i) => [l.replace(/\/\/.*$/, ""), i + 1])
    .filter(([l]) => PATRON.test(l))
    .map(([, n]) => n);
}

export function buscarConsole(raiz = process.cwd()) {
  const hallazgos = [];
  const archivos = [];
  for (const r of RUTAS_PROTEGIDAS) {
    const abs = join(raiz, r);
    if (existsSync(abs)) archivos.push(...recorrer(abs));
  }
  for (const { dir, prefijo } of PREFIJOS_ARCHIVO) {
    const abs = join(raiz, dir);
    if (!existsSync(abs)) continue;
    for (const n of readdirSync(abs)) if (n.startsWith(prefijo) && esFuente(n)) archivos.push(join(abs, n));
  }
  for (const f of archivos) {
    for (const n of lineasInfractoras(readFileSync(f, "utf8"))) {
      hallazgos.push(`${relative(raiz, f).split(sep).join("/")}:${n}`);
    }
  }
  return hallazgos;
}

if (process.argv[1] && import.meta.url === new URL(`file://${process.argv[1]}`).href) {
  const hallazgos = buscarConsole(process.argv[2] ?? process.cwd());
  if (hallazgos.length > 0) {
    console.error("console.log/info/debug prohibido en el Credit Hub:");
    for (const h of hallazgos) console.error(`  ${h}`);
    process.exit(1);
  }
  console.log("sin-console-credit-hub: 0 resultados");
}
