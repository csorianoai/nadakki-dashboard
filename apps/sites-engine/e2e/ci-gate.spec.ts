import { execFileSync } from 'node:child_process';
import { existsSync, mkdtempSync, readdirSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { expect, test } from '@playwright/test';

// Envoltorio: la evidencia del loop solo hace `npm ci` en la raiz y `npx playwright test`,
// y el jest del panel no ve este motor. Aqui se ejecuta vitest por cada spec/st2-NN-*/.
const ROOT = path.resolve(__dirname, '..');
const SPEC = path.join(ROOT, 'spec');
const TAGS = ['[positivo]', '[negativo]', '[tenant-ajeno]'];
const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';

let installed = false;
function ensureInstall(): void {
  if (installed) return;
  execFileSync(npm, ['ci'], { cwd: ROOT, stdio: 'inherit' });
  installed = true;
}

interface Assertion { fullName: string; title: string; status: string }
interface FileResult { name: string; assertionResults: Assertion[] }
interface Report { numTotalTests: number; numFailedTests: number; numPendingTests: number; numTodoTests: number; testResults: FileResult[] }

const dirs = existsSync(SPEC)
  ? readdirSync(SPEC).filter((d) => /^st2-\d{2}-/.test(d)).sort()
  : [];

test.describe.configure({ mode: 'serial' });

test('ST2-00: existe al menos una carpeta spec/st2-NN-*', () => {
  expect(dirs.length).toBeGreaterThan(0);
});

for (const dir of dirs) {
  const n = Number(dir.slice(4, 6));
  test(`ST2-${dir.slice(4, 6)}: vitest spec/${dir}/ sin fallos, skips ni todo`, () => {
    ensureInstall();
    const out = path.join(mkdtempSync(path.join(tmpdir(), 'st2-gate-')), 'report.json');
    try {
      let failed = false;
      try {
        execFileSync(
          path.join(ROOT, 'node_modules', '.bin', 'vitest'),
          ['run', `spec/${dir}/`, '--reporter=json', `--outputFile=${out}`],
          { cwd: ROOT, stdio: 'pipe' },
        );
      } catch {
        failed = true;
      }
      expect(existsSync(out), 'vitest no produjo informe').toBe(true);
      const rep = JSON.parse(readFileSync(out, 'utf8')) as Report;
      expect(rep.numTotalTests, 'cero tests').toBeGreaterThan(0);
      expect(rep.numFailedTests, 'hay tests fallidos').toBe(0);
      expect(rep.numPendingTests, 'hay skips').toBe(0);
      expect(rep.numTodoTests, 'hay todo').toBe(0);
      expect(failed, 'vitest salio con error').toBe(false);
      if (n >= 2) {
        for (const f of rep.testResults) {
          const titles = f.assertionResults.map((a) => a.fullName).join('\n');
          for (const tag of TAGS) {
            expect(titles, `${path.basename(f.name)} sin ${tag}`).toContain(tag);
          }
        }
      }
    } finally {
      rmSync(path.dirname(out), { recursive: true, force: true });
    }
  });
}
