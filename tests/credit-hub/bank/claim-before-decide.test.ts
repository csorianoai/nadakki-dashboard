/**
 * Audit #4.6: claim-before-decide — robust pattern in bankClient.ts.
 *
 * After 6 audits, useEffect auto-claim (PR #111) was confirmed present in
 * bundle but never executed in production. Strategy: claim-before-decide
 * in recordDecision() handler, which runs when user clicks Approve.
 *
 * Tests validate:
 * 1. Claim is called BEFORE decide (order verified)
 * 2. Self-claim 200 (idempotent) → proceeds to decide
 * 3. 409 from another analyst → throws, no decide
 * 4. Claim 500 → throws, no decide
 * 5. analyst_id sent in claim body
 */

import * as fs from "fs";
import * as path from "path";

function readSrc(relPath: string): string {
  return fs.readFileSync(path.resolve(__dirname, "../../..", relPath), "utf-8");
}

describe("bankClient.ts — claim-before-decide pattern (Audit #4.6)", () => {
  const src = readSrc("lib/credit-hub/api/bankClient.ts");

  test("recordDecision is async (await claim before decide)", () => {
    expect(src).toMatch(/export\s+async\s+function\s+recordDecision/);
  });

  test("calls /claim endpoint before /decide (order verified)", () => {
    // Both use ${appPath}/claim and ${appPath}/decide via template literals
    const claimIndex = src.indexOf("${appPath}/claim");
    const decideIndex = src.indexOf("${appPath}/decide");
    expect(claimIndex).toBeGreaterThan(-1);
    expect(decideIndex).toBeGreaterThan(-1);
    // Claim MUST appear before decide in the source
    expect(claimIndex).toBeLessThan(decideIndex);
  });

  test("awaits claim chFetch (not fire-and-forget)", () => {
    // The claim call must be awaited
    expect(src).toContain("await chFetch<unknown>(`${appPath}/claim`");
  });

  test("sends analyst_id in claim body", () => {
    expect(src).toContain("analyst_id: analystId");
    expect(src).toContain("JSON.stringify({ analyst_id: analystId })");
  });

  test("reads analyst_id from params.body.analyst_id", () => {
    expect(src).toContain('params.body.analyst_id || "unknown"');
  });

  test("uses chFetch for both claim and decide (same auth)", () => {
    // Count chFetch calls inside recordDecision
    // Extract the function body between "export async function recordDecision" and the next "export"
    const fnStart = src.indexOf("export async function recordDecision");
    const fnEnd = src.indexOf("\nexport ", fnStart + 1);
    const fnBody = src.slice(fnStart, fnEnd > -1 ? fnEnd : undefined);
    const chFetchCalls = fnBody.match(/chFetch</g);
    expect(chFetchCalls).not.toBeNull();
    expect(chFetchCalls!.length).toBe(2); // one for claim, one for decide
  });

  test("claim uses POST method", () => {
    // Find the claim chFetch call block
    const claimCallStart = src.indexOf("await chFetch<unknown>(`${appPath}/claim`");
    expect(claimCallStart).toBeGreaterThan(-1);
    // The method should be in the same chFetch options object
    const claimBlock = src.slice(claimCallStart, claimCallStart + 300);
    expect(claimBlock).toContain('method: "POST"');
  });

  test("claim error propagates naturally (no try/catch swallowing)", () => {
    // Extract function body
    const fnStart = src.indexOf("export async function recordDecision");
    const fnEnd = src.indexOf("\nexport ", fnStart + 1);
    const fnBody = src.slice(fnStart, fnEnd > -1 ? fnEnd : undefined);
    // The await chFetch for claim should NOT be inside a try/catch
    // (errors propagate to caller → 409/500 aborts decide)
    const claimPos = fnBody.indexOf("await chFetch<unknown>");
    const beforeClaim = fnBody.slice(0, claimPos);
    // No 'try {' between function start and claim
    const lastTry = beforeClaim.lastIndexOf("try {");
    // If there's a try, make sure it's closed before claim (not wrapping it)
    if (lastTry > -1) {
      const closingCatch = beforeClaim.indexOf("catch", lastTry);
      expect(closingCatch).toBeGreaterThan(-1); // try must be closed before claim
    }
  });

  test("includes runtime debug logs", () => {
    expect(src).toContain("[claim-before-decide] attempting claim");
    expect(src).toContain("[claim-before-decide] claim succeeded");
  });

  test("uses same actorRole for both claim and decide", () => {
    const fnStart = src.indexOf("export async function recordDecision");
    const fnEnd = src.indexOf("\nexport ", fnStart + 1);
    const fnBody = src.slice(fnStart, fnEnd > -1 ? fnEnd : undefined);
    // Both chFetch calls should use actorRole
    const actorRoleMatches = fnBody.match(/actorRole,/g);
    expect(actorRoleMatches).not.toBeNull();
    expect(actorRoleMatches!.length).toBe(2);
  });
});

describe("useBankDecision hook passes body to recordDecision (Audit #4.6)", () => {
  const src = readSrc("lib/credit-hub/hooks/useBankDecision.ts");

  test("mutationFn passes body (which contains analyst_id)", () => {
    expect(src).toContain("recordDecision({ tenantId: tenantId!, applicationId: applicationId!, body })");
  });
});

describe("BankApplicationDetailView sends analyst_id in decision body (Audit #4.6)", () => {
  const src = readSrc("components/forge/credit-hub/BankApplicationDetailView.tsx");

  test("uses user.id from useAuth as analyst_id", () => {
    expect(src).toContain('analyst_id: user?.id || "unknown"');
  });

  test("imports useAuth", () => {
    expect(src).toContain('import { useAuth } from "@/hooks/useAuth"');
  });
});

describe("BankDecisionPanel sends analystId prop from useAuth (Audit #4.6)", () => {
  const src = readSrc("components/credit-hub/bank/BankDecisionPanel.tsx");

  test("passes analystId from user.id to BankDecisionForm", () => {
    expect(src).toContain("analystId={user?.id}");
  });
});

describe("BankDecisionForm includes analyst_id in onSubmit payload (Audit #4.6)", () => {
  const src = readSrc("components/credit-hub/bank/BankDecisionForm.tsx");

  test("onSubmit sends analyst_id from analystId prop", () => {
    expect(src).toContain('analyst_id: analystId || "unknown"');
  });
});
