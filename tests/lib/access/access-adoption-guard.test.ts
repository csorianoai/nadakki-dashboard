/**
 * Static adoption guard: productive code must not construct the access URLs
 * outside lib/access/**. Tests may cite the paths.
 * Generated OpenAPI types under types/ (star.d.ts) are exempt; other .d.ts are scanned.
 */
import fs from "fs";
import path from "path";

const ROOT = path.resolve(__dirname, "../../..");
const FORBIDDEN = [
  "/api/v1/access/entitlements/batch",
  "/api/v1/access/readiness",
  "/api/v1/access/plans",
  "/api/v1/access/subscription",
  "/api/v1/access/sponsorship",
];

/** Empty on purpose: no product exception. lib/access/** and tests/** are skipped by walk rules. */
const ALLOWLIST: string[] = [];

function skipDir(name: string): boolean {
  return (
    name === "node_modules" ||
    name === ".next" ||
    name === ".git" ||
    name === "legacy" ||
    name === "tests" ||
    name === "e2e" ||
    name === "coverage"
  );
}

function isGeneratedTypesDeclaration(posix: string): boolean {
  return posix.startsWith("types/") && posix.endsWith(".d.ts");
}

function walk(dir: string, acc: string[]): void {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (skipDir(entry.name)) continue;
      walk(path.join(dir, entry.name), acc);
      continue;
    }
    if (!/\.(ts|tsx|js|jsx)$/.test(entry.name)) continue;
    const full = path.join(dir, entry.name);
    const posix = rel(full);
    if (isGeneratedTypesDeclaration(posix)) continue;
    acc.push(full);
  }
}

function rel(file: string): string {
  return path.relative(ROOT, file).split(path.sep).join("/");
}

function adoptionViolations(files: string[]): string[] {
  const violations: string[] = [];
  for (const file of files) {
    const posix = rel(file);
    if (posix.startsWith("lib/access/")) continue;
    if (ALLOWLIST.includes(posix)) continue;
    const text = fs.readFileSync(file, "utf8");
    for (const needle of FORBIDDEN) {
      if (text.includes(needle)) violations.push(`${posix}:${needle}`);
    }
  }
  return violations;
}

describe("DASH-ACCESS-ADOPTION-01 guard", () => {
  test("T6 no productive direct access URLs outside lib/access", () => {
    const files: string[] = [];
    walk(ROOT, files);
    expect(adoptionViolations(files)).toEqual([]);
  });

  test("types generated d.ts are exempt; other d.ts stay in the scan", () => {
    const files: string[] = [];
    walk(ROOT, files);
    const posix = files.map(rel);
    expect(posix.some((p) => p.startsWith("types/") && p.endsWith(".d.ts"))).toBe(false);
    expect(posix).toContain("next-env.d.ts");
    expect(isGeneratedTypesDeclaration("types/autos-portal-api.d.ts")).toBe(true);
    expect(isGeneratedTypesDeclaration("lib/x.d.ts")).toBe(false);
  });

  test("lib/x.d.ts with a forbidden URL is a violation", () => {
    const probe = path.join(ROOT, "lib", "x.d.ts");
    fs.writeFileSync(probe, `export type Forbidden = "${FORBIDDEN[4]}";\n`);
    try {
      const files: string[] = [];
      walk(ROOT, files);
      expect(files.map(rel)).toContain("lib/x.d.ts");
      expect(adoptionViolations(files)).toContain(`lib/x.d.ts:${FORBIDDEN[4]}`);
    } finally {
      fs.unlinkSync(probe);
    }
  });
});
