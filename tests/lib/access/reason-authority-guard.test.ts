/**
 * T6: semantic access-error authority. Walks the dealer/access tree,
 * not two filenames. Canonical constructor: lib/access/client.ts.
 */
import fs from "fs";
import path from "path";

const ROOT = path.resolve(__dirname, "../../..");
const CANONICAL = new Set(["lib/access/client.ts"]);
const SCOPES = [
  "app/autos/dealer",
  "components/dealer",
  "lib/access",
  "lib/autos-portal",
  "lib/dealer",
];
const skipDir = new Set(["node_modules", ".next", ".git", "legacy", "tests", "e2e", "coverage"]);

function walk(dir: string, acc: string[]): void {
  if (!fs.existsSync(dir)) return;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (skipDir.has(entry.name)) continue;
      walk(path.join(dir, entry.name), acc);
      continue;
    }
    if (!/\.(ts|tsx)$/.test(entry.name)) continue;
    acc.push(path.join(dir, entry.name));
  }
}

function rel(file: string): string {
  return path.relative(ROOT, file).split(path.sep).join("/");
}

describe("access reason-code single authority", () => {
  test("T6 no alternate parser, body-field walk, or local 501 fallback", () => {
    const files: string[] = [];
    for (const scope of SCOPES) walk(path.join(ROOT, scope), files);
    const violations: string[] = [];
    for (const file of files) {
      const posix = rel(file);
      const text = fs.readFileSync(file, "utf8");
      if (text.includes("reasonCodeFromEntitlementError")) {
        violations.push(`${posix}:reasonCodeFromEntitlementError`);
      }
      if (CANONICAL.has(posix)) continue;
      if (/\b(body|root|payload)\s*\??\.\s*(reason_code|error_code|error)\b/.test(text)) {
        violations.push(`${posix}:direct-body-reason-field`);
      }
      if (/detail\s*\??\.\s*(reason_code|error_code|error)\b/.test(text)) {
        violations.push(`${posix}:manual-envelope-parser`);
      }
      if (/status\s*===\s*501/.test(text) && /TARGET_CORE_NOT_READY/.test(text)) {
        violations.push(`${posix}:local-501-fallback`);
      }
    }
    expect(violations).toEqual([]);
  });
});
