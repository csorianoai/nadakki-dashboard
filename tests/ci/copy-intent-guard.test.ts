const { assessCopyIntent } = require("../../tools/ci/validate-copy-intent.js") as typeof import("../../tools/ci/validate-copy-intent.js");

describe("copy intent guard", () => {
  test("fails when a non-live copy changes without declaration", () => {
    expect(assessCopyIntent(["app/credit/applications/page.tsx"], "PR normal").ok).toBe(false);
  });

  test("passes an intentional non-live copy change", () => {
    expect(assessCopyIntent(["app/(bank)/workflow-real/page.tsx"], "COPIA_INTENCIONAL: legacy audit").ok).toBe(true);
  });

  test("mutation: removing the declaration fails again", () => {
    const withDeclaration = assessCopyIntent(["app/bank/analytics/page.tsx"], "COPIA_INTENCIONAL");
    const withoutDeclaration = assessCopyIntent(["app/bank/analytics/page.tsx"], "");
    expect(withDeclaration.ok).toBe(true);
    expect(withoutDeclaration.ok).toBe(false);
  });
});
