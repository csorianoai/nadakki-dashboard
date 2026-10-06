/**
 * BFF v1 catch-all proxy — Sprint 3 Sub-B (P0-D).
 */

import * as fs from "fs";
import * as path from "path";

function readSrc(relPath: string): string {
  return fs.readFileSync(path.resolve(__dirname, "../..", relPath), "utf-8");
}

describe("BFF v1 catch-all proxy", () => {
  const src = readSrc("app/api/v1/[[...path]]/route.ts");
  const shared = readSrc("lib/api/bff-proxy-headers.ts");

  test("exports all HTTP methods", () => {
    expect(src).toMatch(/export\s+async\s+function\s+GET/);
    expect(src).toMatch(/export\s+async\s+function\s+POST/);
    expect(src).toMatch(/export\s+async\s+function\s+PUT/);
    expect(src).toMatch(/export\s+async\s+function\s+PATCH/);
    expect(src).toMatch(/export\s+async\s+function\s+DELETE/);
  });

  test("forwards Authorization via shared header builder", () => {
    expect(src).toContain("buildBffUpstreamHeaders");
    expect(shared).toMatch(/Authorization/);
    expect(shared).toMatch(/req\.headers\.get\("Authorization"\)/);
  });

  test("does not forward client X-Role; forwards Idempotency-Key like v2", () => {
    expect(shared).not.toContain('headers["X-Role"]');
    expect(shared).toContain('"Idempotency-Key"');
  });

  test("targets /api/v1/ on backend", () => {
    expect(src).toContain("/api/v1/");
  });

  test("preserves governance/run exception", () => {
    expect(src).toContain("governance/run");
  });
});
