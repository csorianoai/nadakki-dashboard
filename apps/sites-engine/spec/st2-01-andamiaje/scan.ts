import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { builtinModules } from 'node:module';
import path from 'node:path';

const SCAN_DIRS = ['src', 'spec', 'e2e'];
const EXTS = ['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs'];
const PANEL_NAME = 'nadakki-dashboard';
const IMPORT_RES = [
  /^\s*(?:import|export)\s[^'"]*?from\s*['"]([^'"]+)['"]/gm,
  /^\s*import\s*['"]([^'"]+)['"]/gm,
  // sin comillas antes en la linea: no cuenta texto dentro de literales (fixtures)
  /^[^'"`\n]*\bimport\(\s*['"`]([^'"`]+)['"`]\s*\)/gm,
  /^[^'"`\n]*\bvi\.(?:mock|doMock|importActual|importMock)\(\s*['"`]([^'"`]+)['"`]/gm,
  /\brequire\(\s*['"]([^'"]+)['"]\s*\)/g,
];

function walk(dir: string, out: string[]): void {
  if (!existsSync(dir)) return;
  for (const name of readdirSync(dir)) {
    if (name === 'node_modules' || name === '.next') continue;
    const p = path.join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (EXTS.includes(path.extname(p))) out.push(p);
  }
}

function inside(root: string, p: string): boolean {
  const rel = path.relative(root, p);
  return rel === '' || (!rel.startsWith('..') && !path.isAbsolute(rel));
}

function exists(base: string): boolean {
  if (existsSync(base) && statSync(base).isFile()) return true;
  return EXTS.some((e) => existsSync(base + e) || existsSync(path.join(base, 'index' + e)));
}

/** Devuelve la lista de violaciones de aislamiento (vacia = limpio). */
export function scanCoupling(root: string): string[] {
  const problems: string[] = [];
  const pkgPath = path.join(root, 'package.json');
  const pkg = existsSync(pkgPath) ? JSON.parse(readFileSync(pkgPath, 'utf8')) : {};
  if (pkg.name === PANEL_NAME) problems.push(`package.json: name coincide con el del panel (${PANEL_NAME})`);
  const deps = new Set([...Object.keys(pkg.dependencies ?? {}), ...Object.keys(pkg.devDependencies ?? {})]);
  const builtins = new Set(builtinModules);

  const files: string[] = [];
  for (const d of SCAN_DIRS) walk(path.join(root, d), files);
  for (const file of files) {
    const text = readFileSync(file, 'utf8');
    for (const re of IMPORT_RES) {
      for (const m of text.matchAll(re)) {
        const spec = m[1];
        const where = `${path.relative(root, file)}: '${spec}'`;
        if (spec.startsWith('.')) {
          const target = path.resolve(path.dirname(file), spec);
          if (!inside(root, target)) problems.push(`${where} sale de la carpeta`);
        } else if (spec.startsWith('@/')) {
          const target = path.resolve(root, 'src', spec.slice(2));
          if (!inside(path.join(root, 'src'), target)) problems.push(`${where} alias @/ sale de src`);
          else if (!exists(target)) problems.push(`${where} alias @/ no existe en src (del panel?)`);
        } else if (spec.startsWith('node:') || builtins.has(spec)) {
          continue;
        } else {
          const parts = spec.split('/');
          const name = spec.startsWith('@') ? parts.slice(0, 2).join('/') : parts[0];
          if (!deps.has(name)) problems.push(`${where} dependencia no declarada en package.json`);
        }
      }
    }
  }
  return problems;
}
