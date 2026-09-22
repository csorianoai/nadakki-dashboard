import { deriveDealerCoreUiState } from "@/lib/dealer/core-status";

describe("deriveDealerCoreUiState", () => {
  const live = {
    capability_key: "credit.applications.create",
    status: "LIVE",
    is_usable: true,
    version: "1",
    notes: null,
  };

  test("READY only when usable and batch allowed", () => {
    const ready = deriveDealerCoreUiState({
      accessError: false,
      entry: live,
      batch: { allowed: true, reason_code: "ALLOWED" },
    });
    expect(ready.state).toBe("READY");
    expect(ready.action).toBe("open");
  });

  test("does not mark READY when a route exists but is_usable is false", () => {
    const pending = deriveDealerCoreUiState({
      accessError: false,
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
      entry: null,
      batch: { allowed: true, reason_code: "ALLOWED" },
    });
    expect(missing.state).toBe("NOT_READY");
  });

  test("usable but membership denied is BLOCKED", () => {
    const blocked = deriveDealerCoreUiState({
      accessError: false,
      entry: live,
      batch: { allowed: false, reason_code: "UPGRADE_REQUIRED" },
    });
    expect(blocked.state).toBe("BLOCKED");
    expect(blocked.reason_code).toBe("UPGRADE_REQUIRED");
    expect(blocked.action).toBe("upgrade");
  });

  test("readiness BLOCKED stays BLOCKED", () => {
    const blocked = deriveDealerCoreUiState({
      accessError: false,
      entry: { ...live, status: "BLOCKED", is_usable: false },
      batch: { allowed: false, reason_code: "DEFAULT_DENY" },
    });
    expect(blocked.state).toBe("BLOCKED");
  });

  test("TARGET_CORE_NOT_READY is NOT_READY", () => {
    const notReady = deriveDealerCoreUiState({
      accessError: false,
      entry: live,
      batch: { allowed: false, reason_code: "TARGET_CORE_NOT_READY" },
    });
    expect(notReady.state).toBe("NOT_READY");
    expect(notReady.reason_code).toBe("TARGET_CORE_NOT_READY");
  });

  test("access error is ERROR", () => {
    expect(
      deriveDealerCoreUiState({ accessError: true, entry: live, batch: null }).state,
    ).toBe("ERROR");
  });
});
