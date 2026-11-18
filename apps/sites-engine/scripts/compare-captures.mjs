#!/usr/bin/env node
/* global process, console, URL, document */
// Comparador de capturas full-page contra la linea base de Baylara (ST2-08, 3.17c).
//   node scripts/compare-captures.mjs --site-id S --reference URL --candidate URL [--routes quality/routes.json]
//        [--baseline-dir D] [--out D] [--threshold 0.001] [--update-baseline] [--only prefijo]
//   node scripts/compare-captures.mjs --site-id S --reference-dir D/S --candidate-dir D2/S   (solo compara PNG ya tomados)
// IMPORTANTE: la referencia y el candidato deben correr con las MISMAS banderas de entorno (p. ej. NODE_ENV): las muestras de
// content.js:12-14 de Baylara aparecen solo fuera de produccion. Salida: 0 todo igual · 1 diferencias · 2 uso/entorno.
import { mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { assertBaselineOwnership, baselineDir, captureName, comparePng, DEFAULT_THRESHOLD, isCi, WIDTHS } from '../quality/lib/compare.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const FLAGS = new Set(['update-baseline']);

function parse(argv) {
  const o = {};
  for (let i = 0; i < argv.length; i++) {
    const k = argv[i].replace(/^--/, '');
    if (!argv[i].startsWith('--')) throw new Error(`argumento inesperado ${argv[i]}`);
    o[k] = FLAGS.has(k) ? true : argv[++i];
  }
  return o;
}

const FIXED = Date.UTC(2026, 0, 15, 12, 0, 0);
const NO_MOTION = '*,*::before,*::after{animation:none!important;transition:none!important;caret-color:transparent!important;scroll-behavior:auto!important}';
const SEEDED = `(() => { let s = 123456789; Math.random = () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; })();`;

/** Captura full-page de cada ruta x ancho: animaciones off, reloj y aleatoriedad fijos, fuentes cargadas, red inactiva. */
async function capture(baseUrl, routes, outDir, only) {
  const { chromium } = await import('@playwright/test');
  mkdirSync(outDir, { recursive: true });
  const browser = await chromium.launch();
  try {
    for (const { width, height } of WIDTHS) {
      const ctx = await browser.newContext({ viewport: { width, height }, reducedMotion: 'reduce', locale: 'es', timezoneId: 'UTC', serviceWorkers: 'block' });
      await ctx.addInitScript(SEEDED);
      for (const route of routes) {
        const name = captureName(route, width);
        if (only && !name.startsWith(only)) continue;
        const page = await ctx.newPage();
        await page.clock.setFixedTime(FIXED);
        await page.goto(new URL(route, baseUrl).href, { waitUntil: 'networkidle' });
        await page.addStyleTag({ content: NO_MOTION });
        await page.evaluate(() => document.fonts.ready);
        await page.waitForLoadState('networkidle');
        await page.screenshot({ path: path.join(outDir, name), fullPage: true, animations: 'disabled', caret: 'hide' });
        await page.close();
      }
      await ctx.close();
    }
  } finally {
    await browser.close();
  }
}

async function main() {
  const o = parse(process.argv.slice(2));
  if (o['update-baseline'] && isCi()) throw Object.assign(new Error('--update-baseline esta prohibido con CI=true'), { code: 2 });
  const siteId = o['site-id'];
  const threshold = o.threshold === undefined ? DEFAULT_THRESHOLD : Number(o.threshold);
  if (!(threshold >= 0 && threshold <= 1)) throw Object.assign(new Error('--threshold fuera de 0..1'), { code: 2 });
  const out = path.resolve(o.out ?? 'test-results/captures');
  const outSite = path.join(out, baselineDir('.', siteId));
  let refDir; let candDir;
  if (o['reference-dir'] || o['candidate-dir']) {
    refDir = path.resolve(o['reference-dir']); candDir = path.resolve(o['candidate-dir']);
    assertBaselineOwnership(refDir, siteId); assertBaselineOwnership(candDir, siteId);
  } else {
    if (!o.reference || !o.candidate) throw Object.assign(new Error('faltan --reference y --candidate (o --reference-dir y --candidate-dir)'), { code: 2 });
    const routes = JSON.parse(readFileSync(path.resolve(o.routes ?? path.join(HERE, '../quality/routes.json')), 'utf8'));
    refDir = o['update-baseline'] ? baselineDir(path.resolve(o['baseline-dir'] ?? 'quality/baseline'), siteId) : path.join(outSite, 'reference');
    candDir = path.join(outSite, 'candidate');
    await capture(o.reference, routes, refDir, o.only);
    await capture(o.candidate, routes, candDir, o.only);
  }
  const names = readdirSync(refDir).filter((n) => n.endsWith('.png') && (!o.only || n.startsWith(o.only))).sort();
  if (names.length === 0) throw Object.assign(new Error('la referencia no tiene capturas'), { code: 2 });
  mkdirSync(path.join(outSite, 'diff'), { recursive: true });
  const results = [];
  for (const n of names) {
    const width = Number(/-(\d+)\.png$/.exec(n)?.[1]);
    const route = n.replace(/-\d+\.png$/, '');
    let r;
    try { r = comparePng(readFileSync(path.join(refDir, n)), readFileSync(path.join(candDir, n)), { threshold }); } catch { r = { status: 'missing', diffPixels: 0, ratio: 1, refHeight: 0, candHeight: 0, diffPng: null }; }
    let diffPath = null;
    if (r.diffPng) { diffPath = path.join(outSite, 'diff', n); writeFileSync(diffPath, r.diffPng); }
    results.push({ route, width, status: r.status, diff_pixels: r.diffPixels, ratio: r.ratio, height_reference: r.refHeight, height_candidate: r.candHeight, diff_png: diffPath });
  }
  const ok = results.every((r) => r.status === 'ok');
  writeFileSync(path.join(outSite, 'report.json'), JSON.stringify({ site_id: siteId, threshold, ok, results }, null, 2));
  for (const r of results.filter((x) => x.status !== 'ok')) console.error(`DIFERENCIA ${r.route} @${r.width}: ${r.status} ratio=${r.ratio.toFixed(5)} ${r.diff_png ?? ''}`);
  console.log(`COMPARE=${ok ? 'PASS' : 'FAIL'} capturas=${results.length} informe=${path.join(outSite, 'report.json')}`);
  process.exit(ok ? 0 : 1);
}

main().catch((e) => { console.error(`error: ${e.message}`); process.exit(2); });
