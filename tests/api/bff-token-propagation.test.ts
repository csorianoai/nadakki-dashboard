/**
 * BFF token propagation tests.
 *
 * Validates that:
 * - v2 catch-all proxy exists and exports all HTTP methods
 * - v1 catch-all proxy exports PUT/PATCH/DELETE (added in this PR)
 * - Bank detail/decision/claim use relative /api/v2/ URLs (BFF path)
 * - Authorization header is forwarded by proxy functions
 *
 * NOTE: Route handlers use next/server (Edge runtime) which is not available
 * in Jest. We validate via source-level analysis instead of direct imports.
 */

import * as fs from "fs";
import * as path from "path";

function readSrc(relPath: string): string {
  return fs.readFileSync(path.resolve(__dirname, "../..", relPath), "utf-8");
}

describe("BFF v2 proxy route handler", () => {
  const src = readSrc("app/api/v2/[[...path]]/route.ts");
  const shared = readSrc("lib/api/bff-proxy-headers.ts");

  test("file exists and is non-empty", () => {
    expect(src.length).toBeGreaterThan(100);
  });

  test("exports GET handler", () => {
    expect(src).toMatch(/export\s+async\s+function\s+GET/);
  });

  test("exports POST handler", () => {
    expect(src).toMatch(/export\s+async\s+function\s+POST/);
  });

  test("exports PUT handler", () => {
    expect(src).toMatch(/export\s+async\s+function\s+PUT/);
  });

  test("exports PATCH handler", () => {
    expect(src).toMatch(/export\s+async\s+function\s+PATCH/);
  });

  test("exports DELETE handler", () => {
    expect(src).toMatch(/export\s+async\s+function\s+DELETE/);
  });

  test("forwards Authorization header via shared builder", () => {
    expect(src).toContain("buildBffUpstreamHeaders");
  });

  test("targets /api/v2/ on backend", () => {
    expect(src).toContain("/api/v2/");
  });

  test("forwards X-Role header for bank endpoints", () => {
    expect(shared).toContain('"X-Role"');
  });

  test("forwards Idempotency-Key header", () => {
    expect(shared).toContain('"Idempotency-Key"');
  });
});

describe("BFF v1 proxy route handler", () => {
  const src = readSrc("app/api/v1/[[...path]]/route.ts");
  const shared = readSrc("lib/api/bff-proxy-headers.ts");

  test("exports GET handler", () => {
    expect(src).toMatch(/export\s+async\s+function\s+GET/);
  });

  test("exports POST handler", () => {
    expect(src).toMatch(/export\s+async\s+function\s+POST/);
  });

  test("exports PUT handler", () => {
    expect(src).toMatch(/export\s+async\s+function\s+PUT/);
  });

  test("exports PATCH handler", () => {
    expect(src).toMatch(/export\s+async\s+function\s+PATCH/);
  });

  test("exports DELETE handler", () => {
    expect(src).toMatch(/export\s+async\s+function\s+DELETE/);
  });

  test("forwards Authorization via shared BFF header builder", () => {
    expect(src).toContain("buildBffUpstreamHeaders");
    expect(shared).toMatch(/req\.headers\.get\("Authorization"\)/);
  });

  test("does not hardcode default tenant credicefi", () => {
    expect(src).not.toMatch(/"credicefi"/);
  });
});

describe("bank endpoints use relative /api/v2/ URLs (BFF path)", () => {
  test("fetchBankApplicationDetail uses relative /api/v2/credit/", () => {
    const src = readSrc("lib/bank-application-detail/fetch-detail.ts");
    expect(src).toContain("`/api/v2/credit/applications/");
    expect(src).not.toContain("BACKEND_URL");
  });

  test("submitBankDecision uses relative /api/v2/credit/", () => {
    const src = readSrc("lib/bank-decision/submit-decision.ts");
    expect(src).toContain("`/api/v2/credit/applications/");
    expect(src).toContain("/decide");
  });

  test("claimBankApplication uses relative /api/v2/credit/", () => {
    const src = readSrc("lib/bank-application-detail/claim-application.ts");
    expect(src).toContain("`/api/v2/credit/applications/");
    expect(src).toContain("/claim");
  });
});
