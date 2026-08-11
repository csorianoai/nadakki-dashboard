import {
  buildWizardDraftStorageKey,
  clearWizardDraftStorage,
  LEGACY_GLOBAL_WIZARD_DRAFT_KEYS,
  purgeLegacyGlobalWizardDraftKeys,
} from "@/lib/credit-hub/dealer/wizard-draft-storage";

describe("wizard-draft-storage", () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  test("buildWizardDraftStorageKey scopes by tenant and user", () => {
    expect(buildWizardDraftStorageKey("tenant-a", "user-1")).toBe(
      "nadakki_dealer_wizard_v1_tenant-a_user-1",
    );
  });

  test("purgeLegacyGlobalWizardDraftKeys removes global keys without reading", () => {
    for (const key of LEGACY_GLOBAL_WIZARD_DRAFT_KEYS) {
      localStorage.setItem(key, '{"applicant_full_name":"PII"}');
    }
    purgeLegacyGlobalWizardDraftKeys();
    for (const key of LEGACY_GLOBAL_WIZARD_DRAFT_KEYS) {
      expect(localStorage.getItem(key)).toBeNull();
    }
  });

  test("clearWizardDraftStorage removes scoped key and legacy keys", () => {
    localStorage.setItem(LEGACY_GLOBAL_WIZARD_DRAFT_KEYS[0], "legacy");
    const scoped = buildWizardDraftStorageKey("t1", "u1");
    localStorage.setItem(scoped, "draft");
    sessionStorage.setItem("forge-dealer-wizard-autosave-first-success-v1", "1");

    clearWizardDraftStorage("t1", "u1");

    expect(localStorage.getItem(LEGACY_GLOBAL_WIZARD_DRAFT_KEYS[0])).toBeNull();
    expect(localStorage.getItem(scoped)).toBeNull();
    expect(sessionStorage.getItem("forge-dealer-wizard-autosave-first-success-v1")).toBeNull();
  });
});
