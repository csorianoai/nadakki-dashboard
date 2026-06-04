/**
 * Middleware JWT claim compatibility test (P0-D).
 *
 * Validates that middleware.ts accepts both `tenant_id` (backend v2)
 * and `tid` (legacy) JWT claims for tenant isolation.
 */

import * as fs from "fs";
import * as path from "path";

function readSrc(relPath: string): string {
  return fs.readFileSync(path.resolve(__dirname, "../..", relPath), "utf-8");
}

describe("Middleware JWT tenant claim extraction", () => {
  const src = readSrc("middleware.ts");

  test("accepts tenant_id claim from backend v2 JWTs", () => {
    expect(src).toContain("payload?.tenant_id");
  });

  test("falls back to tid claim for legacy tokens", () => {
    expect(src).toContain("payload?.tid");
  });

  test("uses nullish coalescing for claim priority (tenant_id > tid)", () => {
    expect(src).toMatch(/payload\?\.tenant_id\s*\?\?\s*payload\?\.tid/);
  });

  test("rejects tokens with neither tenant_id nor tid", () => {
    expect(src).toContain("INVALID_TOKEN");
  });

  test("sets x-resolved-tenant-id header downstream", () => {
    expect(src).toContain("x-resolved-tenant-id");
  });

  test("sets x-user-role header for superadmin detection", () => {
    expect(src).toContain("x-user-role");
    expect(src).toContain("platform_superadmin");
  });
});
