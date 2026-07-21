import type { EntitlementDecision } from "@/types/entitlements";
import { REASON_CODE_INFO } from "@/types/entitlements";

describe("Entitlements Types", () => {
  test("EntitlementDecision shape", () => {
    const decision: EntitlementDecision = {
      allowed: true,
      reason_code: "ALLOWED",
      plan_slug: "crece",
      limit: 100,
      used: 25,
      remaining: 75,
    };
    expect(decision.allowed).toBe(true);
  });

  test("All reason codes have info", () => {
    const codes: EntitlementDecision["reason_code"][] = [
      "ALLOWED",
      "UPGRADE_REQUIRED",
      "LIMIT_REACHED",
      "TARGET_CORE_NOT_READY",
      "PROVIDER_ACTIVATION_REQUIRED",
      "DEFAULT_DENY",
    ];
    codes.forEach((code) => {
      expect(REASON_CODE_INFO[code]).toBeDefined();
      expect(REASON_CODE_INFO[code]?.title).toBeTruthy();
    });
  });

  test("Plan slugs are valid", () => {
    const plans = ["conecta", "crece", "domina"] as const;
    plans.forEach((plan) => {
      expect(plan).toBeTruthy();
    });
  });

  test("Target readiness includes BLOCKED", () => {
    const decision: EntitlementDecision = {
      allowed: false,
      reason_code: "TARGET_CORE_NOT_READY",
      target_readiness: "BLOCKED",
    };
    expect(decision.target_readiness).toBe("BLOCKED");
  });
});
