import fs from "node:fs";
import path from "node:path";

import { dealerWizardErrorMessage } from "@/lib/credit-hub/dealer/wizard-error";

const providerPath = path.join(
  process.cwd(),
  "components/forge/credit-hub/dealer/DealerWizardProvider.tsx",
);

function readProvider(): string {
  return fs.readFileSync(providerPath, "utf8");
}

function assertServerPersistenceContract(source: string): void {
  expect(source).toMatch(/createDraftApplication\(\{ tenantId \}\)/);
  expect((source.match(/await patchApplicationFields\(\{/g) ?? []).length).toBeGreaterThanOrEqual(2);
  expect(source).toMatch(/getApplication\(\{ tenantId, applicationId: consentApplicationId \}\)/);
  expect(source).toMatch(/hydrateFormFromServer\(application\.raw\)/);
  expect(source).toMatch(/localStorage\.setItem\(applicationIdStorageKey, applicationId\)/);
}

describe("F9 wizard persistence", () => {
  test("creates on a valid advance, patches the step, and hydrates a reopened draft from the server", () => {
    const source = readProvider();
    assertServerPersistenceContract(source);

    expect(source).not.toMatch(/useEffect\(\(\) => \{[\s\S]{0,1200}createDraftApplication/);
  });

  test("mutation removing the step PATCH fails the persistence contract", () => {
    const mutatedSource = readProvider().replace("await patchApplicationFields({", "/* mutation: PATCH removed */ patchApplicationFields({");
    expect(() => assertServerPersistenceContract(mutatedSource)).toThrow();
  });

  test("maps authorization 404 to a permanent denial instead of a retryable error", () => {
    const error = Object.assign(new Error("Not found"), { status: 404 });
    expect(dealerWizardErrorMessage(error)).toMatch(/No tienes autorización/);
    expect(dealerWizardErrorMessage(new Error("network"))).toBe("network");
  });
});
