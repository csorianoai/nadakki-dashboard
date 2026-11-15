import { execFileSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, rmSync, writeFileSync, readFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { scanCoupling } from './scan';

const ROOT = path.resolve(__dirname, '../..');

function fixture(importPath: string): string {
  const dir = mkdtempSync(path.join(tmpdir(), 'st2-01-'));
  mkdirSync(path.join(dir, 'src'), { recursive: true });
  writeFileSync(path.join(dir, 'package.json'), JSON.stringify({ name: '@nadakki/sites-engine' }));
  writeFileSync(path.join(dir, 'src', 'a.ts'), "import x from '" + importPath + "';\nexport default x;\n");
  return dir;
}

describe('ST2-01 andamiaje autocontenido', () => {
  it('[positivo] el motor real no tiene imports fuera de apps/sites-engine', () => {
    expect(scanCoupling(ROOT)).toEqual([]);
  });

  it('[positivo] tsc --noEmit del tsconfig propio no da errores', () => {
    const tsc = path.join(ROOT, 'node_modules', 'typescript', 'bin', 'tsc');
    expect(() => execFileSync(process.execPath, [tsc, '--noEmit', '-p', ROOT], { stdio: 'pipe' })).not.toThrow();
  });

  it('[positivo] tsconfig propio: sin extends, alias @/* a ./src/*, excluye reference', () => {
    const cfg = JSON.parse(readFileSync(path.join(ROOT, 'tsconfig.json'), 'utf8'));
    expect(cfg.extends).toBeUndefined();
    expect(cfg.compilerOptions.paths['@/*']).toEqual(['./src/*']);
    expect(cfg.exclude).toContain('reference/**');
  });

  it('[positivo] next.config fija cabeceras de seguridad y no usa Domain=', () => {
    const src = readFileSync(path.join(ROOT, 'next.config.ts'), 'utf8');
    for (const h of ['nosniff', 'Referrer-Policy', 'Permissions-Policy', 'X-Robots-Tag']) expect(src).toContain(h);
    expect(src).toContain('poweredByHeader: false');
    expect(src).not.toMatch(/domain\s*=/i);
  });

  it('[negativo] un import relativo que sale de la carpeta falla', () => {
    const dir = fixture('../../../lib/x');
    try {
      expect(scanCoupling(dir).length).toBe(1);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('[negativo] un import @/lib/x que no existe en src (alias del panel) falla', () => {
    const dir = fixture('@/lib/x');
    try {
      expect(scanCoupling(dir).length).toBe(1);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('[negativo] package.json con el nombre del panel falla', () => {
    const dir = fixture('node:path');
    writeFileSync(path.join(dir, 'package.json'), JSON.stringify({ name: 'nadakki-dashboard' }));
    try {
      expect(scanCoupling(dir).length).toBe(1);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('[tenant-ajeno] no aplica: el andamiaje no maneja datos de tenant', () => {
    expect(existsSync(path.join(ROOT, 'src', 'app', 'health', 'page.tsx'))).toBe(true);
    const page = readFileSync(path.join(ROOT, 'src', 'app', 'health', 'page.tsx'), 'utf8');
    expect(page).not.toMatch(/tenant/i);
    expect(page).toContain('noindex');
  });
});
