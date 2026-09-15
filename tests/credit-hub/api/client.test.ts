import {
  CHApiError,
  CHMutationForbiddenError,
  TenantRequiredError,
  chFetch,
  extractCreditHubReasonCode,
  resolveCreditHubFetchUrl,
} from "@/lib/credit-hub/api/client";
import { FeatureDisabledError } from "@/lib/credit-hub/utils/featureDisabled";
import { tokenStorage } from "@/lib/auth/token-storage";

const uuidV4Re =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

function mockJson(body: unknown, status = 200) {
  return Promise.resolve(
    {
      status,
      statusText: status >= 400 ? "Error" : "OK",
      ok: status >= 200 && status < 300,
      clone: () => ({
        json: async () => body,
      }),
      json: async () => body,
    } as Response
  );
}

function installFetchMock() {
  const fn = jest.fn();
  Object.defineProperty(global, "fetch", {
    value: fn,
    writable: true,
    configurable: true,
  });
  return jest.spyOn(global, "fetch");
}

function resetPublicApiEnv(): Record<string, string | undefined> {
  const keys = ["NEXT_PUBLIC_API_BASE_URL", "NEXT_PUBLIC_API_URL", "NEXT_PUBLIC_NADAKKI_API_BASE"] as const;
  const snapshot: Record<string, string | undefined> = {};
  for (const k of keys) {
    snapshot[k] = process.env[k];
    delete process.env[k];
  }
  return snapshot;
}

function restorePublicApiEnv(snapshot: Record<string, string | undefined>): void {
  for (const [k, v] of Object.entries(snapshot)) {
    if (v === undefined) delete process.env[k];
    else process.env[k] = v;
  }
}

describe("resolveCreditHubFetchUrl", () => {
  let snapshot: Record<string, string | undefined>;

  beforeEach(() => {
    snapshot = resetPublicApiEnv();
    tokenStorage.clearTokens();
    window.localStorage.clear();
  });

  afterEach(() => {
    restorePublicApiEnv(snapshot);
    tokenStorage.clearTokens();
    window.localStorage.clear();
  });

  test("returns relative path unchanged when no API base env is set", () => {
    expect(resolveCreditHubFetchUrl("/api/v1/sic/credit-applications")).toBe("/api/v1/sic/credit-applications");
  });

  test("uses a same-origin path in the browser", () => {
    process.env.NEXT_PUBLIC_API_URL = "https://nadakki-ai-suite.onrender.com/";
    expect(resolveCreditHubFetchUrl("/api/v1/foo")).toBe("/api/v1/foo");
  });

  test("does not double-prefix absolute http(s) URLs", () => {
    process.env.NEXT_PUBLIC_API_URL = "https://nadakki-ai-suite.onrender.com";
    expect(resolveCreditHubFetchUrl("https://other.example/api")).toBe("https://other.example/api");
  });
});

describe("chFetch - headers", () => {
  let snapshot: Record<string, string | undefined>;

  beforeEach(() => {
    jest.restoreAllMocks();
    snapshot = resetPublicApiEnv();
    window.localStorage.clear();
    tokenStorage.clearTokens();
  });

  afterEach(() => {
    restorePublicApiEnv(snapshot);
    tokenStorage.clearTokens();
    window.localStorage.clear();
  });

  test("sends X-Tenant-ID from init.tenantId", async () => {
    const fetchSpy = installFetchMock().mockResolvedValue(await mockJson({}));
    await chFetch("/test", { tenantId: "tenant-abc", actorRole: "dealer" });
    const headers = fetchSpy.mock.calls[0][1]?.headers as Record<string, string>;
    expect(headers["X-Tenant-ID"]).toBe("tenant-abc");
  });

  test("sends X-Actor-Role from init.actorRole", async () => {
    const fetchSpy = installFetchMock().mockResolvedValue(await mockJson({}));
    await chFetch("/test", { tenantId: "t", actorRole: "admin" });
    const headers = fetchSpy.mock.calls[0][1]?.headers as Record<string, string>;
    expect(headers["X-Actor-Role"]).toBe("admin");
  });

  test("sends Idempotency-Key on POST as UUID v4", async () => {
    const fetchSpy = installFetchMock().mockResolvedValue(await mockJson({}));
    await chFetch("/test", { tenantId: "t", actorRole: "dealer", method: "POST" });
    const headers = fetchSpy.mock.calls[0][1]?.headers as Record<string, string>;
    expect(headers["Idempotency-Key"]).toMatch(uuidV4Re);
  });

  test("does NOT send Idempotency-Key on GET", async () => {
    const fetchSpy = installFetchMock().mockResolvedValue(await mockJson({}));
    await chFetch("/test", { tenantId: "t", actorRole: "dealer" });
    const headers = fetchSpy.mock.calls[0][1]?.headers as Record<string, string>;
    expect(headers["Idempotency-Key"]).toBeUndefined();
  });
});

describe("chFetch - auth and routing", () => {
  let snapshot: Record<string, string | undefined>;

  beforeEach(() => {
    jest.restoreAllMocks();
    snapshot = resetPublicApiEnv();
    window.localStorage.clear();
    tokenStorage.clearTokens();
  });

  afterEach(() => {
    restorePublicApiEnv(snapshot);
    tokenStorage.clearTokens();
    window.localStorage.clear();
  });

  test("sends Authorization Bearer header when nadakki_sic_token is in localStorage", async () => {
    window.localStorage.setItem("nadakki_sic_token", "jwt.abc.123");
    const fetchSpy = installFetchMock().mockResolvedValue(await mockJson({}));
    await chFetch("/api/v1/sic/test", { tenantId: "t", actorRole: "dealer" });
    const headers = fetchSpy.mock.calls[0][1]?.headers as Record<string, string>;
    expect(headers.Authorization).toBe("Bearer jwt.abc.123");
  });

  test("prefers Auth v2 access token from tokenStorage over legacy localStorage key", async () => {
    tokenStorage.setTokens({ accessToken: "v2-access", refreshToken: "v2-refresh" });
    window.localStorage.setItem("nadakki_sic_token", "legacy-should-not-win");
    const fetchSpy = installFetchMock().mockResolvedValue(await mockJson({}));
    await chFetch("/api/v1/sic/test", { tenantId: "t", actorRole: "dealer" });
    const headers = fetchSpy.mock.calls[0][1]?.headers as Record<string, string>;
    expect(headers.Authorization).toBe("Bearer v2-access");
  });

  test("does NOT send Authorization header when token is absent", async () => {
    const fetchSpy = installFetchMock().mockResolvedValue(await mockJson({}));
    await chFetch("/api/v1/sic/test", { tenantId: "t", actorRole: "dealer" });
    const headers = fetchSpy.mock.calls[0][1]?.headers as Record<string, string>;
    expect(headers.Authorization).toBeUndefined();
  });

  test("uses relative URL when no public API base env is set", async () => {
    const fetchSpy = installFetchMock().mockResolvedValue(await mockJson({}));
    await chFetch("/api/v1/sic/credit-applications", {
      tenantId: "t",
      actorRole: "dealer",
    });
    expect(fetchSpy.mock.calls[0][0]).toBe("/api/v1/sic/credit-applications");
  });

  test("uses a same-origin URL when NEXT_PUBLIC_API_URL is set", async () => {
    process.env.NEXT_PUBLIC_API_URL = "https://nadakki-ai-suite.onrender.com";
    const fetchSpy = installFetchMock().mockResolvedValue(await mockJson({}));
    await chFetch("/api/v1/sic/credit-applications", {
      tenantId: "t",
      actorRole: "dealer",
    });
    expect(fetchSpy.mock.calls[0][0]).toBe("/api/v1/sic/credit-applications");
  });
});

describe("chFetch - error handling", () => {
  let snapshot: Record<string, string | undefined>;

  beforeEach(() => {
    jest.restoreAllMocks();
    snapshot = resetPublicApiEnv();
    window.localStorage.clear();
    tokenStorage.clearTokens();
  });

  afterEach(() => {
    restorePublicApiEnv(snapshot);
    tokenStorage.clearTokens();
    window.localStorage.clear();
  });

  test("throws TenantRequiredError when tenantId is empty string", async () => {
    await expect(chFetch("/test", { tenantId: "", actorRole: "dealer" })).rejects.toThrow(
      TenantRequiredError
    );
  });

  test("throws FeatureDisabledError on 503 with feature_enabled:false at root", async () => {
    installFetchMock()
      .mockResolvedValue(await mockJson({ feature_enabled: false }, 503));
    await expect(chFetch("/test", { tenantId: "t", actorRole: "admin" })).rejects.toThrow(
      FeatureDisabledError
    );
  });

  test("throws FeatureDisabledError on 503 with detail.error=routeone_parity_disabled", async () => {
    installFetchMock().mockResolvedValue(
      await mockJson(
        { detail: { error: "routeone_parity_disabled", message: "Parity off" } },
        503
      )
    );
    await expect(chFetch("/test", { tenantId: "t", actorRole: "admin" })).rejects.toThrow(
      FeatureDisabledError
    );
  });

  test("throws FeatureDisabledError on 503 with detail string containing parity", async () => {
    installFetchMock()
      .mockResolvedValue(await mockJson({ detail: "RouteOne parity is disabled." }, 503));
    await expect(chFetch("/test", { tenantId: "t", actorRole: "admin" })).rejects.toThrow(
      FeatureDisabledError
    );
  });

  test("throws CHApiError (NOT FeatureDisabled) on regular 503 server error", async () => {
    installFetchMock()
      .mockResolvedValueOnce(await mockJson({ detail: "Database connection lost" }, 503))
      .mockResolvedValueOnce(await mockJson({ detail: "Database connection lost" }, 503));

    await expect(chFetch("/test", { tenantId: "t", actorRole: "admin" })).rejects.toThrow(
      CHApiError
    );
  });

  test("throws CHApiError with status 422 and detail message", async () => {
    installFetchMock()
      .mockResolvedValue(await mockJson({ detail: "Validation failed" }, 422));

    await expect(chFetch("/test", { tenantId: "t", actorRole: "dealer" })).rejects.toMatchObject(
      { status: 422, detail: "Validation failed" }
    );
  });

  test("preserves reason_code on 409 already_claimed envelope", async () => {
    installFetchMock().mockResolvedValue(
      await mockJson({ detail: { error: "already_claimed", message: "taken" } }, 409),
    );
    await expect(chFetch("/test", { tenantId: "t", actorRole: "bank_analyst", method: "POST" })).rejects.toMatchObject({
      status: 409,
      reasonCode: "already_claimed",
      detail: "Esta solicitud ya fue reclamada por otro analista",
    });
  });

  test("preserves reason_code on 403 NO_ORGANIZATION_UNIT envelope", async () => {
    installFetchMock().mockResolvedValue(
      await mockJson({ reason_code: "NO_ORGANIZATION_UNIT" }, 403),
    );
    await expect(chFetch("/test", { tenantId: "t", actorRole: "dealer" })).rejects.toMatchObject({
      status: 403,
      reasonCode: "NO_ORGANIZATION_UNIT",
      detail: "Falta la unidad organizacional para completar esta acción",
    });
  });

  test("401 uses envelope message instead of a blank Unauthorized", async () => {
    const fetchSpy = installFetchMock().mockResolvedValue(
      await mockJson({ detail: { error: "not_authenticated" } }, 401),
    );
    await expect(chFetch("/test", { tenantId: "t", actorRole: "dealer" })).rejects.toMatchObject({
      status: 401,
      reasonCode: "not_authenticated",
      detail: "Debes iniciar sesión para continuar",
    });
    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });

  test("does not retry 501 Not Implemented", async () => {
    const fetchSpy = installFetchMock().mockResolvedValue(
      await mockJson({ reason_code: "TARGET_CORE_NOT_READY" }, 501),
    );
    await expect(chFetch("/test", { tenantId: "t", actorRole: "dealer" })).rejects.toMatchObject({
      status: 501,
      reasonCode: "TARGET_CORE_NOT_READY",
      detail: "Este núcleo todavía no está disponible",
    });
    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });

  test("translates FastAPI validation arrays instead of exposing raw JSON", async () => {
    installFetchMock().mockResolvedValue(await mockJson({
      detail: [{ type: "missing", loc: ["body", "changes"], msg: "Field required" }],
    }, 422));

    await expect(chFetch("/test", { tenantId: "t", actorRole: "dealer" })).rejects.toMatchObject({
      status: 422,
      message: "No se pudo guardar la solicitud. Field required",
    });
  });

  test("retries once on 500 then throws if both fail", async () => {
    const fetchSpy = installFetchMock()
      .mockResolvedValue(await mockJson({ detail: "Internal error" }, 500));

    await expect(chFetch("/test", { tenantId: "t", actorRole: "dealer" })).rejects.toThrow(
      CHApiError
    );
    expect(fetchSpy).toHaveBeenCalledTimes(2);
  });

  test("extractCreditHubReasonCode reads nested FastAPI envelopes", () => {
    expect(extractCreditHubReasonCode({ detail: { reason_code: "TARGET_CORE_NOT_READY" } })).toBe(
      "TARGET_CORE_NOT_READY",
    );
    expect(extractCreditHubReasonCode({ error_code: "already_claimed" })).toBe("already_claimed");
  });

  test("200 with body returns parsed json", async () => {
    installFetchMock().mockResolvedValue(await mockJson({ ok: true, value: 42 }));
    const result = await chFetch<{ ok: boolean; value: number }>("/test", {
      tenantId: "t",
      actorRole: "admin",
    });
    expect(result).toEqual({ ok: true, value: 42 });
  });

  test("viewer dashboard role blocks mutations before fetch", async () => {
    window.localStorage.setItem("nadakki_role", "viewer");
    const fetchSpy = installFetchMock().mockResolvedValue(await mockJson({}));

    await expect(
      chFetch("/test", { tenantId: "t", actorRole: "dealer", method: "POST" })
    ).rejects.toThrow(CHMutationForbiddenError);
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});
