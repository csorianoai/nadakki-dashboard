/**
 * Static adoption guard: productive code must not construct the four access URLs
 * outside lib/access/**. Tests may cite the paths.
 */
import fs from "fs";
import path from "path";

const ROOT = path.resolve(__dirname, "../../..");
const FORBIDDEN = [
  "/api/v1/access/entitlements/batch",
  "/api/v1/access/readiness",
  "/api/v1/access/plans",
  "/api/v1/access/subscription",
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

function walk(dir: string, acc: string[]): void {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (skipDir(entry.name)) continue;
      walk(path.join(dir, entry.name), acc);
      continue;
    }
    if (!/\.(ts|tsx|js|jsx)$/.test(entry.name)) continue;
    acc.push(path.join(dir, entry.name));
  }
}

function rel(file: string): string {
  return path.relative(ROOT, file).split(path.sep).join("/");
}

describe("DASH-ACCESS-ADOPTION-01 guard", () => {
  test("T6 no productive direct access URLs outside lib/access", () => {
    const files: string[] = [];
    walk(ROOT, files);
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
    expect(violations).toEqual([]);
  });
});
