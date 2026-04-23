import { describe, expect, it } from "@jest/globals";
import {
  BudgetExceededError,
  FeatureDisabledError,
  MissingTenantError,
  NetworkError,
  TenantMismatchError,
  UnknownIntentError,
} from "@/types/spyfu";

describe("SpyFu error classes", () => {
  it("MissingTenantError name", () => {
    expect(new MissingTenantError().name).toBe("MissingTenantError");
  });
  it("TenantMismatchError", () => {
    expect(new TenantMismatchError().message).toContain("tenant");
  });
  it("UnknownIntentError carries examples", () => {
    const e = new UnknownIntentError("x", { en: ["a"] });
    expect(e.examples.en).toEqual(["a"]);
  });
  it("BudgetExceededError detail", () => {
    const e = new BudgetExceededError("cap", { rows_used: 1, rows_cap: 2 });
    expect(e.rows_cap).toBe(2);
  });
  it("FeatureDisabledError", () => {
    expect(new FeatureDisabledError().name).toBe("FeatureDisabledError");
  });
  it("NetworkError", () => {
    expect(new NetworkError("down").name).toBe("NetworkError");
  });
});
