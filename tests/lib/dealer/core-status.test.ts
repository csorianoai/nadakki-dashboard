import {
  DEALER_CORE_STATUS_ROWS,
  MIGRATION_097_CAPABILITY_KEYS,
  NO_CATALOG_CAPABILITY_REASON,
  deriveDealerCoreUiState,
} from "@/lib/dealer/core-status";

describe("deriveDealerCoreUiState", () => {
  const live = {
    capability_key: "credit.applications.view",
    status: "LIVE",
    is_usable: true,
    version: "1",
    notes: null,
  };

  test("rows use distinct 097 readinessKey and actionCapability", () => {
    const invented = [
      "credit.applications.create",
      "legal.quick_check",
      "marketing.campaigns.create",
      "accounting.commissions.view",
      "autos.inventory.view",
    ];
    for (const row of DEALER_CORE_STATUS_ROWS) {
      expect(MIGRATION_097_CAPABILITY_KEYS.has(row.readinessKey)).toBe(true);
      expect(MIGRATION_097_CAPABILITY_KEYS.has(row.actionCapability)).toBe(true);
      expect(row.readinessKey).not.toBe(row.actionCapability);
      expect(invented).not.toContain(row.readinessKey);
      expect(invented).not.toContain(row.actionCapability);
    }
  });

  test("LIVE with is_usable false is never READY even if batch allows", () => {
    const notReady = deriveDealerCoreUiState({
      accessError: false,
      readinessKey: "credit.applications.view",
      entry: { ...live, is_usable: false },
      batch: { allowed: true, reason_code: "ALLOWED" },
    });
    expect(notReady.state).toBe("NOT_READY");
    expect(notReady.action).toBeNull();
  });

  test("READY when usable even if batch denies — batch is CTA only", () => {
    const ready = deriveDealerCoreUiState({
      accessError: false,
      readinessKey: "credit.applications.view",
      entry: live,
      batch: { allowed: false, reason_code: "UPGRADE_REQUIRED" },
    });
    expect(ready.state).toBe("READY");
    expect(ready.action).toBe("upgrade");
  });

  test("READY and open when usable and actionCapability allowed", () => {
    const ready = deriveDealerCoreUiState({
      accessError: false,
      readinessKey: "credit.applications.view",
      entry: live,
      batch: { allowed: true, reason_code: "ALLOWED" },
    });
    expect(ready.state).toBe("READY");
    expect(ready.action).toBe("open");
  });

  test("PENDING_EXTERNAL_ACTIVATION is NOT_READY", () => {
    const pending = deriveDealerCoreUiState({
      accessError: false,
      readinessKey: "credit.applications.view",
      entry: {
        ...live,
        status: "PENDING_EXTERNAL_ACTIVATION",
        is_usable: false,
      },
      batch: { allowed: true, reason_code: "ALLOWED" },
    });
    expect(pending.state).toBe("NOT_READY");
  });

  test("missing readiness entry is NOT_READY, never READY", () => {
    const missing = deriveDealerCoreUiState({
      accessError: false,
      readinessKey: "credit.applications.view",
      entry: null,
      batch: { allowed: true, reason_code: "ALLOWED" },
    });
    expect(missing.state).toBe("NOT_READY");
  });

  test("invented readinessKey is NOT_READY sin capability en catalogo", () => {
    const missing = deriveDealerCoreUiState({
      accessError: false,
      readinessKey: "credit.applications.create",
      entry: { ...live, capability_key: "credit.applications.create", is_usable: true },
      batch: { allowed: true, reason_code: "ALLOWED" },
    });
    expect(missing.state).toBe("NOT_READY");
    expect(missing.reason).toBe(NO_CATALOG_CAPABILITY_REASON);
  });

  test("readiness BLOCKED stays BLOCKED regardless of batch", () => {
    const blocked = deriveDealerCoreUiState({
      accessError: false,
      readinessKey: "credit.applications.view",
      entry: { ...live, status: "BLOCKED", is_usable: false },
      batch: { allowed: true, reason_code: "ALLOWED" },
    });
    expect(blocked.state).toBe("BLOCKED");
    expect(blocked.action).toBe("contact_admin");
  });

  test("access error is ERROR", () => {
    expect(
      deriveDealerCoreUiState({
        accessError: true,
        readinessKey: "credit.applications.view",
        entry: live,
        batch: null,
      }).state,
    ).toBe("ERROR");
  });
});
