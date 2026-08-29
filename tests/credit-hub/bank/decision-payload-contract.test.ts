/**
 * Audit #4.2: /decide payload contract tests.
 *
 * Validates that the legacy Credit-Hub decision flow (BankDecisionForm →
 * bankClient.recordDecision) sends a payload matching the backend's
 * DecideRequest schema:
 *
 *   { decision_type: "APPROVE"|"REJECT"|"COUNTER", reason_codes, ... }
 *
 * NOT the broken legacy shape:
 *
 *   { decision: "APROBADO", terms: { approved_amount: 0, ... } }
 */

import * as fs from "fs";
import * as path from "path";

function readSrc(relPath: string): string {
  return fs.readFileSync(path.resolve(__dirname, "../../..", relPath), "utf-8");
}

describe("bankClient.ts — toBankDecideRequestBody transformer (Audit #4.2)", () => {
  const src = readSrc("lib/credit-hub/api/bankClient.ts");

  test("has DECISION_TYPE_MAP mapping Spanish → English enum", () => {
    expect(src).toContain("DECISION_TYPE_MAP");
    expect(src).toContain('APROBADO: "APPROVE"');
    expect(src).toContain('RECHAZADO: "REJECT"');
    expect(src).toContain('CONTRA_OFERTA: "COUNTER"');
    expect(src).toContain('EN_REVISION: "COUNTER"');
  });

  test("builds decision_type field (not decision)", () => {
    expect(src).toContain("decision_type: decisionType");
    // Transformer output should NOT contain bare `decision:` as a key
    const transformerBody = src.match(/function toBankDecideRequestBody[\s\S]*?return body;\s*\}/);
    expect(transformerBody).not.toBeNull();
    expect(transformerBody![0]).toContain("decision_type");
    expect(transformerBody![0]).not.toMatch(/^\s+decision:/m);
  });

  test("includes reason_codes in payload (backend requires min 1)", () => {
    expect(src).toContain("reason_codes: reasonCodes");
    expect(src).toContain("DEFAULT_REASON_CODE");
    expect(src).toContain("RC001_APPROVE");
    expect(src).toContain("RC101_REJECT_CREDIT_POLICY");
    expect(src).toContain("RC201_COUNTER_AMOUNT");
  });

  test("maps justification → notes", () => {
    expect(src).toContain("notes: legacy.justification");
  });

  test("sets adverse_action for REJECT", () => {
    expect(src).toContain('adverse_action: decisionType === "REJECT"');
  });

  test("builds counter_terms for COUNTER decision type", () => {
    const counterBlock = src.match(/if \(decisionType === "COUNTER"\)[\s\S]*?\}/);
    expect(counterBlock).not.toBeNull();
    expect(counterBlock![0]).toContain("counter_terms");
    expect(counterBlock![0]).toContain("legacy.terms.approved_amount");
    expect(counterBlock![0]).toContain("legacy.terms.interest_rate");
    expect(counterBlock![0]).toContain("legacy.terms.term_months");
    expect(counterBlock![0]).toContain("legacy.terms.down_payment_required");
  });

  test("builds stipulations for APPROVE with conditions", () => {
    // Verify the full transformer contains stipulation building logic
    const transformer = src.match(/function toBankDecideRequestBody[\s\S]*?return body;/);
    expect(transformer).not.toBeNull();
    expect(transformer![0]).toContain("stipulations");
    expect(transformer![0]).toContain("code:");
    expect(transformer![0]).toContain("description: cond");
  });

  test("recordDecision calls toBankDecideRequestBody before JSON.stringify", () => {
    // The transformer is called and its result is stringified
    expect(src).toContain("const backendBody = toBankDecideRequestBody(params.body)");
    expect(src).toContain("JSON.stringify(backendBody)");
    // Should NOT stringify the raw legacy body directly in recordDecision
    expect(src).not.toContain("JSON.stringify(params.body)");
  });

  test("EN_REVISION maps to COUNTER with no_match: true", () => {
    expect(src).toContain('no_match: legacy.decision === "EN_REVISION"');
  });
});

describe("BankDecisionForm — no hardcoded analyst_id (Audit #4.2)", () => {
  const src = readSrc("components/credit-hub/bank/BankDecisionForm.tsx");

  test("does NOT contain hardcoded bank-analyst-demo", () => {
    expect(src).not.toContain('"bank-analyst-demo"');
  });

  test("accepts analystId as prop", () => {
    expect(src).toContain("analystId");
    // Should be in the props destructuring
    expect(src).toMatch(/analystId\??: string/);
  });

  test("passes analystId to onSubmit payload", () => {
    expect(src).toContain('analyst_id: analystId || "unknown"');
  });
});

describe("BankApplicationDetailView — no hardcoded analyst_id (Audit #4.2)", () => {
  const src = readSrc("components/forge/credit-hub/BankApplicationDetailView.tsx");

  test("does NOT contain hardcoded bank-analyst-demo", () => {
    expect(src).not.toContain('"bank-analyst-demo"');
  });

  test("imports useAuth for real analyst ID", () => {
    expect(src).toContain("useAuth");
    expect(src).toContain("user?.id");
  });

  test("uses user.id as analyst_id in decision body", () => {
    expect(src).toContain('analyst_id: user?.id || "unknown"');
  });
});

describe("BankDecisionPanel — passes analystId from auth context (Audit #4.2)", () => {
  const src = readSrc("components/credit-hub/bank/BankDecisionPanel.tsx");

  test("imports useAuth", () => {
    expect(src).toContain("useAuth");
  });

  test("destructures user from useAuth", () => {
    expect(src).toContain("const { user } = useAuth()");
  });

  test("passes analystId prop to BankDecisionForm", () => {
    expect(src).toContain("analystId={user?.id}");
  });
});

describe("defaultTerms reads from analysis state (not hardcoded zeros)", () => {
  const src = readSrc("components/credit-hub/bank/BankDecisionPanel.tsx");

  test("reads approved_amount from analysis.financed_amount", () => {
    const termsFn = src.match(/function defaultTerms[\s\S]*?conditions:[\s\S]*?\n\}/);
    expect(termsFn).not.toBeNull();
    expect(termsFn![0]).toContain("analysis?.financed_amount");
  });

  test("reads interest_rate from metrics.annual_rate", () => {
    const termsFn = src.match(/function defaultTerms[\s\S]*?conditions:[\s\S]*?\n\}/);
    expect(termsFn).not.toBeNull();
    expect(termsFn![0]).toContain("metrics?.annual_rate");
  });

  test("reads term_months from metrics.term_months", () => {
    const termsFn = src.match(/function defaultTerms[\s\S]*?conditions:[\s\S]*?\n\}/);
    expect(termsFn).not.toBeNull();
    expect(termsFn![0]).toContain("metrics?.term_months");
  });

  test("reads down_payment from metrics.down_payment", () => {
    const termsFn = src.match(/function defaultTerms[\s\S]*?conditions:[\s\S]*?\n\}/);
    expect(termsFn).not.toBeNull();
    expect(termsFn![0]).toContain("metrics?.down_payment");
  });
});

describe("BankDetailLayout — approval terms do not fabricate defaults", () => {
  const src = readSrc("components/credit-hub/bank/BankDetailLayout.tsx");
  const termsFn = src.match(/function defaultTerms[\s\S]*?\n\}/);

  test("has a measurable defaultTerms implementation", () => {
    expect(termsFn).not.toBeNull();
  });

  test("does not invent amount, rate, or term when source data is absent", () => {
    expect(termsFn![0]).not.toContain(": 0");
    expect(termsFn![0]).not.toContain("?? 17.5");
    expect(termsFn![0]).not.toContain("?? 36");
  });
});
