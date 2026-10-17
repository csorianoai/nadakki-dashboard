/**
 * El expediente v1 (bank) no debe registrar datos con console.log/info/debug.
 * Recorre las rutas del expediente y falla si encuentra alguno.
 */
import fs from "fs";
import path from "path";

const ROOT = path.resolve(__dirname, "../..");
const FORBIDDEN = /\bconsole\s*\.\s*(log|info|debug)\b/;

const DIRS = ["app/(forge)/credit-hub/bank", "components/credit-hub/bank"];
const HOOK_DIR = "lib/credit-hub/hooks";
const HOOK_PREFIX = "useBank";

function walk(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) return walk(full);
    return /\.(ts|tsx|js|jsx)$/.test(e.name) ? [full] : [];
  });
}

function bankFiles(): string[] {
  const hooks = fs.existsSync(path.join(ROOT, HOOK_DIR))
    ? fs
        .readdirSync(path.join(ROOT, HOOK_DIR))
        .filter((n) => n.startsWith(HOOK_PREFIX) && /\.(ts|tsx)$/.test(n))
        .map((n) => path.join(ROOT, HOOK_DIR, n))
    : [];
  return [...DIRS.flatMap((d) => walk(path.join(ROOT, d))), ...hooks];
}

function findViolations(source: string): number[] {
  return source
    .split("\n")
    .flatMap((line, i) => (FORBIDDEN.test(line) ? [i + 1] : []));
}

describe("bank v1: sin console.log/info/debug", () => {
  it("detecta una reintroducción (fixture de texto)", () => {
    expect(findViolations('const a = 1;\n  console.log("x", a);\n')).toEqual([2]);
    expect(findViolations("console.info(1)")).toEqual([1]);
    expect(findViolations("console . debug(1)")).toEqual([1]);
    expect(findViolations('console.warn("ok"); console.error("ok");')).toEqual([]);
  });

  it("encuentra archivos para revisar", () => {
    expect(bankFiles().length).toBeGreaterThan(5);
  });

  it("ningún archivo del expediente v1 usa console.log/info/debug", () => {
    const offenders = bankFiles().flatMap((f) =>
      findViolations(fs.readFileSync(f, "utf8")).map(
        (n) => `${path.relative(ROOT, f)}:${n}`,
      ),
    );
    expect(offenders).toEqual([]);
  });
});
