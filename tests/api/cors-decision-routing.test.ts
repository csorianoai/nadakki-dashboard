/**
 * Audit #4.1: CORS preflight fix — decision routing tests.
 *
 * Validates:
 * - chFetch (client.ts): browser always uses relative URLs (same-origin)
 * - useSelectOffer.ts: no direct BACKEND_URL cross-origin calls
 * - BFF v2 catch-all: exports OPTIONS handler for defense-in-depth
 * - submit-decision.ts: uses relative URL (unchanged, sanity check)
 */

import * as fs from "fs";
import * as path from "path";

function readSrc(relPath: string): string {
  return fs.readFileSync(path.resolve(__dirname, "../..", relPath), "utf-8");
}

describe("chFetch client — browser uses same-origin (Audit #4.1)", () => {
  const src = readSrc("lib/credit-hub/api/client.ts");

  test("getCreditHubApiBaseUrl returns empty string in browser", () => {
    // The function should return "" when window is defined
    expect(src).toMatch(/typeof window !== "undefined"\) return ""/);
  });

  test("resolveCreditHubFetchUrl keeps relative paths in browser", () => {
    expect(src).toContain("resolveCreditHubFetchUrl");
    // When base is "", relative paths stay relative
    expect(src).toContain('if (!base) return normalizedPath');
  });

  test("does NOT reference BACKEND_URL directly", () => {
    // chFetch uses getCreditHubApiBaseUrl() — not a hardcoded constant
    expect(src).not.toMatch(/const BACKEND_URL/);
  });
});

describe("useSelectOffer — same-origin routing (Audit #4.1)", () => {
  const src = readSrc("hooks/useSelectOffer.ts");

  test("does NOT contain BACKEND_URL constant", () => {
    expect(src).not.toMatch(/const BACKEND_URL/);
    expect(src).not.toContain("onrender.com");
  });

  test("does NOT reference NEXT_PUBLIC_NADAKKI_API_URL", () => {
    expect(src).not.toContain("NEXT_PUBLIC_NADAKKI_API_URL");
  });

  test("buildUrl produces relative /api/v2/credit/ path", () => {
    expect(src).toContain("`/api/v2/credit/applications/");
    expect(src).toContain("/accept");
  });

  test("sends X-Tenant-ID header", () => {
    expect(src).toContain('"X-Tenant-ID"');
  });

  test("sends Authorization Bearer header", () => {
    expect(src).toContain("Authorization");
    expect(src).toContain("`Bearer ${token}`");
  });
});

describe("BFF v2 catch-all exports OPTIONS handler (Audit #4.1)", () => {
  const src = readSrc("app/api/v2/[[...path]]/route.ts");

  test("exports OPTIONS handler", () => {
    expect(src).toMatch(/export\s+async\s+function\s+OPTIONS/);
  });

  test("OPTIONS returns 204 No Content", () => {
    // Should return 204 status for preflight
    expect(src).toContain("status: 204");
  });
});

describe("submit-decision uses relative URL (sanity check)", () => {
  const src = readSrc("lib/bank-decision/submit-decision.ts");

  test("uses relative /api/v2/credit/ URL", () => {
    expect(src).toContain("`/api/v2/credit/applications/");
    expect(src).toContain("/decide");
  });

  test("does NOT use BACKEND_URL", () => {
    expect(src).not.toMatch(/const BACKEND_URL/);
    expect(src).not.toContain("onrender.com");
  });
});

describe("proactive audit — remaining cross-origin risks (Sprint 4 scope)", () => {
  test("credit-api.ts still uses BACKEND_URL (Sprint 4 migration target)", () => {
    const src = readSrc("lib/credit-api.ts");
    // This file intentionally not fixed in this PR — documenting the risk
    expect(src).toContain("BACKEND_URL");
  });
});
