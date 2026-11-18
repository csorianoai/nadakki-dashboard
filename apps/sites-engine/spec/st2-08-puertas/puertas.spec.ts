import { execFile } from 'node:child_process';
import { existsSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { checkCsp, scriptHash } from '../../quality/lib/csp.mjs';
import { applyAllowlist, loadAllowlist, AXE_TAGS, withLanguages } from '../../quality/lib/axe.mjs';
import { evaluateRuns, median, memoryVerdict, MIN_PERF } from '../../quality/lib/lighthouse.mjs';
import { startTestServer } from '../../quality/lib/test-server.mjs';

const CLI = path.resolve(__dirname, '../../scripts/quality-gates.mjs');
const run = promisify(execFile);
let tmp = '';
beforeAll(() => { tmp = mkdtempSync(path.join(tmpdir(), 'st2-08-gates-')); });
afterAll(() => rmSync(tmp, { recursive: true, force: true }));

async function gate(args: string[]) {
  const env = { ...process.env } as NodeJS.ProcessEnv;
  delete env.CI;
  try {
    const r = await run('node', [CLI, ...args], { encoding: 'utf8', env, timeout: 280_000 });
    return { code: 0, out: r.stdout, err: r.stderr };
  } catch (e) {
    const x = e as { code: number; stdout: string; stderr: string };
    return { code: x.code, out: x.stdout, err: x.stderr };
  }
}

const INLINE = 'window.__x=1';
const GOOD_CSP = `default-src 'self'; script-src 'self' '${scriptHash(INLINE)}'; style-src 'self'`;

describe('ST2-08 CSP por ruta x idioma', () => {
  it('[positivo] cabecera sin unsafe-* y script inline con hash declarado -> sin problemas', () => {
    expect(checkCsp({ csp: GOOD_CSP, html: `<html><script>${INLINE}</script></html>` })).toEqual([]);
    expect(checkCsp({ csp: "script-src 'self' 'nonce-abc'", html: '<script nonce="abc">1</script>' })).toEqual([]);
  });

  it('[negativo] ausencia de cabecera, unsafe-inline, unsafe-eval, script inline sin hash o con nonce ajeno fallan', () => {
    expect(checkCsp({ csp: null, html: '<p>x</p>' }).length).toBeGreaterThan(0);
    expect(checkCsp({ csp: "script-src 'self' 'unsafe-inline'", html: '' }).join()).toContain('unsafe-inline');
    expect(checkCsp({ csp: "script-src 'self' 'unsafe-eval'", html: '' }).join()).toContain('unsafe-eval');
    expect(checkCsp({ csp: GOOD_CSP, html: '<script>alert(1)</script>' }).join()).toContain('inline');
    expect(checkCsp({ csp: "script-src 'self' 'nonce-abc'", html: '<script nonce="zzz">1</script>' }).length).toBe(1);
    expect(checkCsp({ csp: "script-src 'self'", html: '<script type="application/ld+json">{}</script>' })).toEqual([]);
  });

  it('[positivo] el CLI recorre ruta x es/en y pasa con el servidor de prueba', async () => {
    const s = await startTestServer({ siteId: 'sitio-a' });
    try {
      const r = await gate(['csp', '--site-id', 'sitio-a', '--base', s.url, '--only', '/es/contacto', '--out', tmp]);
      expect(r.code, r.err).toBe(0);
      expect(r.out).toContain('CSP=PASS');
      const rep = JSON.parse(readFileSync(path.join(tmp, 'csp', 'sitio-a', 'report.json'), 'utf8'));
      expect(rep.results.map((x: { route: string }) => x.route).sort()).toEqual(['/en/contacto', '/es/contacto']);
    } finally { await s.close(); }
  });

  it('[negativo] una respuesta sin Content-Security-Policy hace fallar el CLI', async () => {
    const s = await startTestServer({ siteId: 'sitio-a', defect: 'sin-csp' });
    try {
      const r = await gate(['csp', '--site-id', 'sitio-a', '--base', s.url, '--only', '/es', '--out', tmp]);
      expect(r.code).toBe(1);
      expect(r.out).toContain('CSP=FAIL');
    } finally { await s.close(); }
  });
});

describe('ST2-08 axe WCAG 2.1 AA', () => {
  it('[positivo] etiquetas wcag2a/aa/21a/21aa, y cada ruta se prueba en es y en', () => {
    expect([...AXE_TAGS]).toEqual(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']);
    expect(withLanguages(['/es', '/en', '/es/vender'])).toEqual(['/es', '/en', '/es/vender', '/en/vender']);
  });

  it('[negativo] la allowlist rechaza entradas sin motivo o fecha, y solo exime regla+ruta exactas', () => {
    expect(() => loadAllowlist({ entries: [{ rule: 'image-alt', route: '/es', reason: '', date: '2026-11-18' }] })).toThrow();
    expect(() => loadAllowlist({ entries: [{ rule: 'image-alt', route: '/es', reason: 'x', date: 'ayer' }] })).toThrow();
    const al = loadAllowlist({ entries: [{ rule: 'image-alt', route: '/es', reason: 'logo de terceros', date: '2026-11-18' }] });
    const v = [{ id: 'image-alt' }, { id: 'label' }];
    expect(applyAllowlist(v, '/es', al).map((x: { id: string }) => x.id)).toEqual(['label']);
    expect(applyAllowlist(v, '/en', al)).toHaveLength(2);
    expect(loadAllowlist(JSON.parse(readFileSync(path.resolve(__dirname, '../../quality/axe-allowlist.json'), 'utf8')))).toEqual([]);
  });

  it('[positivo] ruta de prueba sin violaciones a 1440 y 390 -> exit 0', async () => {
    const s = await startTestServer({ siteId: 'sitio-a' });
    try {
      const r = await gate(['axe', '--site-id', 'sitio-a', '--base', s.url, '--only', '/es', '--out', tmp]);
      expect(r.code, r.out + r.err).toBe(0);
      expect(r.out).toContain('AXE=PASS');
      const rep = JSON.parse(readFileSync(path.join(tmp, 'axe', 'sitio-a', 'report.json'), 'utf8'));
      expect(rep.results.map((x: { width: number }) => x.width).sort()).toEqual([390, 390, 1440, 1440]);
    } finally { await s.close(); }
  }, 120_000);

  it('[negativo] una img sin alt inyectada hace fallar y nombra la regla', async () => {
    const s = await startTestServer({ siteId: 'sitio-a', defect: 'img-sin-alt' });
    try {
      const r = await gate(['axe', '--site-id', 'sitio-a', '--base', s.url, '--only', '/es', '--out', tmp]);
      expect(r.code).toBe(1);
      expect(r.err + r.out).toContain('image-alt');
    } finally { await s.close(); }
  }, 120_000);

  it('[tenant-ajeno] el informe va por site_id: la violacion del sitio B no contamina al A', async () => {
    const a = await startTestServer({ siteId: 'sitio-a' });
    const b = await startTestServer({ siteId: 'sitio-b', defect: 'img-sin-alt' });
    try {
      const out = path.join(tmp, 'ajeno');
      const ra = await gate(['axe', '--site-id', 'sitio-a', '--base', a.url, '--only', '/es', '--out', out]);
      const rb = await gate(['axe', '--site-id', 'sitio-b', '--base', b.url, '--only', '/es', '--out', out]);
      expect([ra.code, rb.code]).toEqual([0, 1]);
      expect(readdirSync(path.join(out, 'axe')).sort()).toEqual(['sitio-a', 'sitio-b']);
      expect((await gate(['axe', '--site-id', '../x', '--base', a.url, '--out', out])).code).toBe(2);
    } finally { await a.close(); await b.close(); }
  }, 180_000);
});

describe('ST2-08 Lighthouse movil', () => {
  it('[positivo] mediana de 3 y umbral 85', () => {
    expect(MIN_PERF).toBe(85);
    expect(median([70, 89, 93])).toBe(89);
    expect(evaluateRuns([70, 89, 93]).pass).toBe(true);
    expect(memoryVerdict(2000, 1200)).toBe('ok');
  });

  it('[negativo] mediana < 85 simulada falla; sin memoria suficiente no hay PASS sino entorno', () => {
    expect(evaluateRuns([80, 70, 90]).pass).toBe(false);
    expect(evaluateRuns([84.9, 84.9, 99]).pass).toBe(false);
    expect(() => evaluateRuns([90, 90])).toThrow();
    expect(memoryVerdict(500, 1200)).toBe('entorno');
  });

  it('[negativo] el CLI sin memoria suficiente sale como entorno (exit 3) y nunca imprime PASS', async () => {
    const s = await startTestServer({ siteId: 'sitio-a' });
    try {
      const r = await gate(['lighthouse', '--site-id', 'sitio-a', '--base', s.url, '--only', '/es', '--out', tmp, '--min-mem-mb', '99999999']);
      expect(r.code).toBe(3);
      expect(r.out).not.toContain('LIGHTHOUSE=PASS');
      expect(r.out).toContain('LIGHTHOUSE=ENTORNO');
    } finally { await s.close(); }
  });

  it('[positivo] 3 corridas reales sobre el servidor de prueba, mediana >= 85 y un JSON por corrida', async () => {
    const s = await startTestServer({ siteId: 'sitio-a' });
    try {
      const out = path.join(tmp, 'lh');
      const r = await gate(['lighthouse', '--site-id', 'sitio-a', '--base', s.url, '--only', '/es', '--out', out, '--min-mem-mb', '300']);
      expect(r.code, r.out + r.err).toBe(0);
      expect(r.out.match(/^LIGHTHOUSE_RUN /gm)).toHaveLength(3);
      expect(r.out).toContain('LIGHTHOUSE=PASS');
      const d = path.join(out, 'lighthouse', 'sitio-a');
      expect(readdirSync(d).filter((f) => f.endsWith('.json') && f !== 'report.json')).toHaveLength(3);
      expect(existsSync(path.join(d, 'report.json'))).toBe(true);
    } finally { await s.close(); }
  }, 290_000);

  it('[tenant-ajeno] el CLI rechaza un site_id con ruta (no escribe fuera de su carpeta)', async () => {
    const r = await gate(['lighthouse', '--site-id', '../ajeno', '--base', 'http://127.0.0.1:1', '--out', tmp]);
    expect(r.code).toBe(2);
    writeFileSync(path.join(tmp, 'ok'), '');
  });
});
