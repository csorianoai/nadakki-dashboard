/**
 * Audit #4.4: Auto-claim on expediente mount.
 *
 * Validates that the bank application detail page auto-claims the application
 * when the user opens it (if not already claimed). This is required because
 * the backend enforces claim-before-decide (PR #306).
 *
 * Source-level tests: read the actual component source and verify patterns.
 */

import * as fs from "fs";
import * as path from "path";

function readSrc(relPath: string): string {
  return fs.readFileSync(path.resolve(__dirname, "../..", relPath), "utf-8");
}

describe("claimBankApplication — sends analyst_id in body (Audit #4.4)", () => {
  const src = readSrc("lib/bank-application-detail/claim-application.ts");

  test("accepts analystId parameter", () => {
    expect(src).toContain("analystId: string");
  });

  test("sends Content-Type: application/json", () => {
    expect(src).toContain('"Content-Type": "application/json"');
  });

  test("sends analyst_id in JSON body", () => {
    expect(src).toContain("JSON.stringify({ analyst_id: analystId })");
  });
});

describe("BankApplicationDetailInner — explicit claim (Audit #4.4)", () => {
  const src = readSrc("app/(bank)/bank/applications/[id]/page.tsx");

  test("does not need a mount-attempt ref", () => {
    expect(src).not.toMatch(/import\s*\{[^}]*useRef[^}]*\}\s*from\s*"react"/);
  });

  test("imports useAuth hook", () => {
    expect(src).toContain('import { useAuth } from "@/hooks/useAuth"');
  });

  test("destructures user from useAuth", () => {
    expect(src).toContain("const { user } = useAuth()");
  });

  test("does not claim while the detail mounts", () => {
    expect(src).not.toContain("autoClaimAttempted");
    expect(src).not.toContain("claimBankApplication(id, analystId)");
  });

  test("handleClaim passes user.id to claimBankApplication", () => {
    expect(src).toContain('const analystId = user?.id || "unknown"');
    expect(src).toContain("claimBankApplication(id, analystId, controller.signal)");
  });
});

describe("BankApplicationDetailView (Forge) — legacy auto-claim audit", () => {
  const src = readSrc("components/forge/credit-hub/BankApplicationDetailView.tsx");

  test("imports useEffect and useRef", () => {
    expect(src).toMatch(/import\s*\{[^}]*useEffect[^}]*useRef[^}]*\}\s*from\s*"react"/);
  });

  test("imports claimBankApplication", () => {
    expect(src).toContain('import { claimBankApplication } from "@/lib/bank-application-detail/claim-application"');
  });

  test("creates autoClaimAttempted ref", () => {
    expect(src).toContain("autoClaimAttempted = useRef(false)");
  });

  test("skips claim if decision already exists", () => {
    expect(src).toContain("if (existing) return");
  });

  test("calls claimBankApplication with application_id and analystId", () => {
    expect(src).toContain("claimBankApplication(application.application_id, analystId)");
  });

  test("silently catches errors", () => {
    expect(src).toContain(".catch(() => {})");
  });
});
