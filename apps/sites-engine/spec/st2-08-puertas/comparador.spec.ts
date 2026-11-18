import { execFile, spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { createServer, type Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { tmpdir } from 'node:os';
import { promisify } from 'node:util';
import path from 'node:path';
import { PNG } from 'pngjs';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { comparePng, baselineDir, isCi, assertBaselineOwnership, captureName } from '../../quality/lib/compare.mjs';

const CLI = path.resolve(__dirname, '../../scripts/compare-captures.mjs');
const ROUTES = JSON.parse(readFileSync(path.resolve(__dirname, '../../quality/routes.json'), 'utf8')) as string[];

// PNG sinteticos generados aqui (sin binarios en el repo).
function png(w: number, h: number, paint?: (x: number, y: number) => boolean): Buffer {
  const p = new PNG({ width: w, height: h });
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const i = (y * w + x) * 4;
    const dark = paint?.(x, y) ?? false;
    p.data[i] = dark ? 0 : 255; p.data[i + 1] = dark ? 0 : 255; p.data[i + 2] = dark ? 0 : 255; p.data[i + 3] = 255;
  }
  return PNG.sync.write(p);
}

let tmp = '';
beforeAll(() => { tmp = mkdtempSync(path.join(tmpdir(), 'st2-08-cmp-')); });
afterAll(() => rmSync(tmp, { recursive: true, force: true }));

function dirs(site: string, ref: Buffer, cand: Buffer, name = 'es-1440.png') {
  const root = mkdtempSync(path.join(tmp, 'c-'));
  const r = path.join(root, 'ref', site); const c = path.join(root, 'cand', site);
  mkdirSync(r, { recursive: true }); mkdirSync(c, { recursive: true });
  writeFileSync(path.join(r, name), ref); writeFileSync(path.join(c, name), cand);
  return { root, r, c };
}
function run(args: string[], env: Record<string, string> = {}) {
  const e = { ...process.env, ...env } as NodeJS.ProcessEnv;
  if (!('CI' in env)) delete e.CI;
  return spawnSync('node', [CLI, ...args], { encoding: 'utf8', env: e });
}

describe('ST2-08 comparador de capturas', () => {
  it('[positivo] dos PNG identicos -> 0 diferencias y exit 0; la lista son las 12 rutas de la linea base', () => {
    const a = png(100, 100);
    const r = comparePng(a, a, { threshold: 0.001 });
    expect(r.diffPixels).toBe(0);
    expect(r.status).toBe('ok');
    expect(ROUTES).toHaveLength(12);
    expect(ROUTES).toContain('/es/privacidad');
    const d = dirs('sitio-a', a, a);
    const out = path.join(d.root, 'out');
    const p = run(['--site-id', 'sitio-a', '--reference-dir', d.r, '--candidate-dir', d.c, '--out', out, '--only', 'es-1440']);
    expect(p.status, p.stderr).toBe(0);
    const rep = JSON.parse(readFileSync(path.join(out, 'sitio-a', 'report.json'), 'utf8'));
    expect(rep.ok).toBe(true);
    expect(rep.results[0].diff_pixels).toBe(0);
  });

  it('[negativo] 1 % de pixeles distintos -> exit 1 e informe con la ruta del PNG de diferencias', () => {
    const a = png(100, 100);
    const b = png(100, 100, (x, y) => y < 1 && x < 100); // 100 de 10.000 = 1 %
    expect(comparePng(a, b, { threshold: 0.001 }).status).toBe('pixels');
    const d = dirs('sitio-a', a, b);
    const out = path.join(d.root, 'out');
    const p = run(['--site-id', 'sitio-a', '--reference-dir', d.r, '--candidate-dir', d.c, '--out', out, '--only', 'es-1440']);
    expect(p.status).toBe(1);
    const rep = JSON.parse(readFileSync(path.join(out, 'sitio-a', 'report.json'), 'utf8'));
    expect(rep.ok).toBe(false);
    expect(rep.results[0].ratio).toBeCloseTo(0.01, 5);
    expect(existsSync(rep.results[0].diff_png)).toBe(true);
    // por debajo del umbral pasa (0,05 %: 5 de 10.000)
    expect(comparePng(a, png(100, 100, (x, y) => y < 1 && x < 5), { threshold: 0.001 }).status).toBe('ok');
  });

  it('[negativo] cualquier diferencia de alto de pagina falla, aunque los pixeles comunes coincidan', () => {
    const r = comparePng(png(100, 100), png(100, 101), { threshold: 0.5 });
    expect(r.status).toBe('height');
    const d = dirs('sitio-a', png(100, 100), png(100, 101));
    const p = run(['--site-id', 'sitio-a', '--reference-dir', d.r, '--candidate-dir', d.c, '--out', path.join(d.root, 'o'), '--only', 'es-1440', '--threshold', '0.5']);
    expect(p.status).toBe(1);
  });

  it('[negativo] --update-baseline con CI=true se rechaza (exit 2) y no escribe nada', () => {
    expect(isCi({ CI: 'true' })).toBe(true);
    expect(isCi({})).toBe(false);
    const base = path.join(tmp, 'baseline-ci');
    const p = run(['--site-id', 'sitio-a', '--reference', 'http://127.0.0.1:9', '--candidate', 'http://127.0.0.1:9', '--baseline-dir', base, '--update-baseline'], { CI: 'true' });
    expect(p.status).toBe(2);
    expect(p.stderr).toMatch(/CI/);
    expect(existsSync(base)).toBe(false);
  });

  it('[tenant-ajeno] la linea base lleva el site_id: capturas del sitio B nunca se comparan con las de A', () => {
    expect(baselineDir('/b', 'sitio-a')).toBe(path.join('/b', 'sitio-a'));
    expect(() => baselineDir('/b', '../x')).toThrow();
    expect(() => assertBaselineOwnership('/b/sitio-a', 'sitio-b')).toThrow();
    expect(() => assertBaselineOwnership('/b/sitio-a', 'sitio-a')).not.toThrow();
    const a = png(50, 50);
    const d = dirs('sitio-a', a, a);
    const p = run(['--site-id', 'sitio-b', '--reference-dir', d.r, '--candidate-dir', d.c, '--out', path.join(d.root, 'o')]);
    expect(p.status).toBe(2);
    expect(captureName('/es/propiedades', 390)).toBe('es_propiedades-390.png');
    expect(captureName('/es', 1440)).toBe('es-1440.png');
  });
});

// Captura real con Chromium de Playwright contra dos servidores locales (0 red externa).
// spawnSync bloquearia el bucle de eventos y los servidores de esta misma prueba no responderian.
const execP = promisify(execFile);
async function runAsync(args: string[], env: NodeJS.ProcessEnv) {
  try { const r = await execP('node', [CLI, ...args], { env }); return { status: 0, out: r.stdout + r.stderr }; }
  catch (e) { const x = e as { code: number; stdout: string; stderr: string }; return { status: x.code, out: x.stdout + x.stderr }; }
}

describe('ST2-08 captura full-page', () => {
  const servers: Server[] = [];
  const serve = (body: string) => new Promise<string>((res) => {
    const s = createServer((_q, r) => { r.setHeader('content-type', 'text/html'); r.end(`<!doctype html><meta charset=utf-8><body style="margin:0">${body}`); });
    s.listen(0, '127.0.0.1', () => { servers.push(s); res(`http://127.0.0.1:${(s.address() as AddressInfo).port}`); });
  });
  afterAll(() => { for (const s of servers) s.close(); });

  it('[positivo] mismo contenido en referencia y candidato -> exit 0 con capturas a 1440 y 390; contenido distinto -> exit 1', async () => {
    const same = '<h1>SYNTH</h1><p>contenido sintetico</p><script>document.title=String(Math.random()+Date.now())</script>';
    const ref = await serve(same); const cand = await serve(same); const other = await serve('<h1>SYNTH</h1><div style="height:900px;background:#000"></div>');
    const routes = path.join(tmp, 'routes1.json'); writeFileSync(routes, JSON.stringify(['/es']));
    const out = path.join(tmp, 'out-real');
    const env = { ...process.env } as NodeJS.ProcessEnv; delete env.CI;
    const ok = await runAsync(['--site-id', 'sitio-a', '--reference', ref, '--candidate', cand, '--routes', routes, '--out', out], env);
    expect(ok.status, ok.out).toBe(0);
    const rep = JSON.parse(readFileSync(path.join(out, 'sitio-a', 'report.json'), 'utf8'));
    expect(rep.results.map((r: { width: number }) => r.width).sort((a: number, b: number) => a - b)).toEqual([390, 1440]);
    const bad = await runAsync(['--site-id', 'sitio-a', '--reference', ref, '--candidate', other, '--routes', routes, '--out', out], env);
    expect(bad.status).toBe(1);
  }, 120_000);
});
