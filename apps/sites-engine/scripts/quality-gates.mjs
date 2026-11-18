#!/usr/bin/env node
/* global process, console, URL, fetch */
// Puertas de calidad de ST2-08: axe (3.17a), Lighthouse movil (3.17b) y CSP por ruta x idioma (D5-bis).
//   node scripts/quality-gates.mjs <axe|lighthouse|csp> --site-id S --base URL [--routes quality/routes.json] [--only ruta-exacta]
//        [--out test-results] [--allowlist quality/axe-allowlist.json] [--min 85] [--min-mem-mb 1200]
// Informe por sitio: <out>/<puerta>/<site_id>/report.json. Salida: 0 PASS · 1 FAIL · 2 uso · 3 entorno (Lighthouse sin memoria: no mide, no hay PASS).
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { applyAllowlist, loadAllowlist, runAxe, withLanguages } from '../quality/lib/axe.mjs';
import { baselineDir, WIDTHS } from '../quality/lib/compare.mjs';
import { checkCsp } from '../quality/lib/csp.mjs';
import { availableMemoryMb, evaluateRuns, memoryVerdict, MIN_PERF, RUNS } from '../quality/lib/lighthouse.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const usage = (m) => Object.assign(new Error(m), { code: 2 });

function parse(argv) {
  const o = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i].startsWith('--')) o[argv[i].slice(2)] = argv[++i]; else o._.push(argv[i]);
  }
  return o;
}

function finish(gate, dir, extra, ok, summary) {
  mkdirSync(dir, { recursive: true });
  writeFileSync(path.join(dir, 'report.json'), JSON.stringify({ gate, ok, ...extra }, null, 2));
  console.log(`${gate.toUpperCase()}=${ok ? 'PASS' : 'FAIL'} ${summary} informe=${path.join(dir, 'report.json')}`);
  process.exit(ok ? 0 : 1);
}

async function launch() {
  const { chromium } = await import('@playwright/test');
  return chromium;
}

async function gateCsp({ base, routes, dir, siteId }) {
  const results = [];
  for (const route of routes) {
    const res = await fetch(new URL(route, base));
    const problems = checkCsp({ csp: res.headers.get('content-security-policy'), html: await res.text() });
    results.push({ route, problems });
    for (const p of problems) console.error(`CSP ${route}: ${p}`);
  }
  finish('csp', dir, { site_id: siteId, results }, results.every((r) => r.problems.length === 0), `rutas=${results.length}`);
}

async function gateAxe({ base, routes, dir, siteId, o }) {
  const allow = loadAllowlist(JSON.parse(readFileSync(path.resolve(o.allowlist ?? path.join(HERE, '../quality/axe-allowlist.json')), 'utf8')));
  const browser = await (await launch()).launch();
  const results = [];
  try {
    for (const { width, height } of WIDTHS) {
      const ctx = await browser.newContext({ viewport: { width, height } });
      for (const route of routes) {
        const page = await ctx.newPage();
        await page.goto(new URL(route, base).href, { waitUntil: 'networkidle' });
        const violations = applyAllowlist(await runAxe(page), route, allow);
        results.push({ route, width, violations: violations.map((v) => ({ id: v.id, impact: v.impact, nodes: v.nodes.length })) });
        for (const v of violations) console.error(`AXE ${route} @${width}: ${v.id} (${v.impact}) x${v.nodes.length}`);
        await page.close();
      }
      await ctx.close();
    }
  } finally { await browser.close(); }
  finish('axe', dir, { site_id: siteId, results }, results.every((r) => r.violations.length === 0), `combinaciones=${results.length}`);
}

async function gateLighthouse({ base, routes, dir, siteId, o }) {
  const minMem = Number(o['min-mem-mb'] ?? 1200);
  const avail = availableMemoryMb(os);
  if (memoryVerdict(avail, minMem) === 'entorno') {
    console.log(`LIGHTHOUSE=ENTORNO memoria disponible ${Math.round(avail)} MB < ${minMem} MB: no se mide, no se publica PASS`);
    process.exit(3);
  }
  const min = Number(o.min ?? MIN_PERF);
  const { default: lighthouse } = await import('lighthouse');
  const chromium = await launch();
  const port = 9300 + (process.pid % 500);
  const browser = await chromium.launch({ args: [`--remote-debugging-port=${port}`] }); // Chromium de Playwright
  mkdirSync(dir, { recursive: true });
  const results = [];
  try {
    for (const route of routes) {
      const scores = [];
      for (let i = 1; i <= RUNS; i++) {
        // movil y throttling simulado son los valores por defecto de Lighthouse
        const r = await lighthouse(new URL(route, base).href, { port, output: 'json', logLevel: 'error', onlyCategories: ['performance'] });
        const score = Math.round((r?.lhr.categories.performance.score ?? 0) * 100);
        writeFileSync(path.join(dir, `${route.replace(/\W+/g, '_').replace(/^_/, '') || 'raiz'}-${i}.json`), r?.report ?? '{}');
        console.log(`LIGHTHOUSE_RUN ${route} corrida=${i} rendimiento=${score}`);
        scores.push(score);
      }
      const ev = evaluateRuns(scores, min);
      results.push({ route, scores, median: ev.median, pass: ev.pass });
      console.log(`LIGHTHOUSE_MEDIANA ${route} ${ev.median} (minimo ${min})`);
    }
  } finally { await browser.close(); }
  finish('lighthouse', dir, { site_id: siteId, min, results }, results.every((r) => r.pass), `rutas=${results.length}`);
}

async function main() {
  const o = parse(process.argv.slice(2));
  const gate = o._[0];
  const gates = { axe: gateAxe, csp: gateCsp, lighthouse: gateLighthouse };
  if (!gates[gate]) throw usage('puerta desconocida: axe | lighthouse | csp');
  if (!o.base) throw usage('falta --base');
  let dir;
  try { dir = baselineDir(path.resolve(o.out ?? 'test-results', gate), o['site-id']); } catch { throw usage('--site-id invalido'); }
  let routes = JSON.parse(readFileSync(path.resolve(o.routes ?? path.join(HERE, '../quality/routes.json')), 'utf8'));
  routes = withLanguages(routes);
  if (o.only) { const pair = withLanguages([o.only]); routes = routes.filter((r) => pair.includes(r)); } // --only = ruta exacta y su gemela de idioma
  if (gate === 'lighthouse') routes = routes.filter((r) => r.startsWith('/es')); // la mediana se mide en es: la plantilla es la misma
  if (routes.length === 0) throw usage('ninguna ruta coincide con --only');
  await gates[gate]({ base: o.base, routes, dir, siteId: o['site-id'], o });
}

main().catch((e) => { console.error(`error: ${e.message}`); process.exit(e.code === 2 ? 2 : 1); });
