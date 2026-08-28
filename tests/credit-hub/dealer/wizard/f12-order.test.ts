import fs from "node:fs";
import path from "node:path";
import { DEALER_WIZARD_STEP_PATHS } from "@/components/forge/credit-hub/dealer/dealerWizardPaths";

const providerPath = path.join(process.cwd(), "components/forge/credit-hub/dealer/DealerWizardProvider.tsx");
const pathsPath = path.join(process.cwd(), "components/forge/credit-hub/dealer/dealerWizardPaths.ts");

function assertOrder(source: string): void {
  expect(source).toMatch(/\["applicant", "consent", "vehicle", "review"\]/);
}

describe("F12 wizard order", () => {
  test("starts with applicant, confirms consent before vehicle and dispatch", () => {
    expect(DEALER_WIZARD_STEP_PATHS).toEqual(["applicant", "consent", "vehicle", "review"]);
    expect(fs.readFileSync(providerPath, "utf8")).toMatch(/stepIndex === 1\) return stepIsValid\(5/);
  });

  test("mutation that puts consent first fails the order contract", () => {
    const inverted = fs.readFileSync(pathsPath, "utf8").replace(
      '["applicant", "consent", "vehicle", "review"]',
      '["consent", "applicant", "vehicle", "review"]',
    );
    expect(() => assertOrder(inverted)).toThrow();
  });
});
