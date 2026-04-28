import { analyzeApplication, getApplicationAnalysis } from "@/lib/credit-hub/api/creditAnalysisClient";
import { CreditCoreApiError } from "@/lib/credit-hub/api/creditCoreClient";

const tenantId = "tenant-analysis-client";
const applicationId = "app-analysis-1";

const analysis = {
  score: 745,
  risk_level: "MEDIO_BAJO",
  approval_band: "PREAPROBABLE",
  payment_capacity: 42000,
  estimated_payment: 31000,
  financed_amount: 900000,
  dti: 0.38,
  debt_capacity: 32000,
  factors: { positive: ["Ingreso suficiente"], negative: [] },
  positive_factors: ["Ingreso suficiente"],
  negative_factors: [],
  recommendations: [],
  explanation: "Cuota dentro de capacidad.",
  confidence: 0.88,
  timestamp: "2026-04-27T20:00:00Z",
  version: "1.0.0",
  engine: "forge_rule_based_v1",
};

function mockFetchSequence(...responses: Array<{ body: unknown; ok?: boolean; status?: number }>) {
  const fn = jest.fn();
  responses.forEach(({ body, ok = true, status = 200 }) => {
    fn.mockResolvedValueOnce({
      ok,
      status,
      statusText: ok ? "OK" : "Conflict",
      headers: new Headers(),
      clone: () => ({ json: async () => body }),
      json: async () => body,
      text: async () => JSON.stringify(body),
    });
  });
  Object.defineProperty(global, "fetch", { value: fn, writable: true, configurable: true });
  return fn;
}

describe("creditAnalysisClient", () => {
  beforeEach(() => {
    jest.restoreAllMocks();
    jest.useRealTimers();
  });

  test("analyzeApplication calls endpoint with tenant header", async () => {
    const fetchMock = mockFetchSequence({ body: analysis });
    const result = await analyzeApplication({ tenantId, applicationId });
    expect(result.score).toBe(745);
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/v2/credit/applications/app-analysis-1/analyze",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({ "X-Tenant-ID": tenantId }),
      })
    );
  });

  test("getApplicationAnalysis calls GET endpoint", async () => {
    const fetchMock = mockFetchSequence({ body: analysis });
    await getApplicationAnalysis({ tenantId, applicationId });
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/v2/credit/applications/app-analysis-1/analysis",
      expect.objectContaining({ method: "GET" })
    );
  });

  test("retries HTTP 409 up to success", async () => {
    jest.useFakeTimers();
    mockFetchSequence(
      { body: { detail: { error: "ANALYSIS_IN_PROGRESS" } }, ok: false, status: 409 },
      { body: analysis, ok: true, status: 200 }
    );
    const promise = analyzeApplication({ tenantId, applicationId });
    await jest.advanceTimersByTimeAsync(2_000);
    await expect(promise).resolves.toMatchObject({ score: 745 });
  });

  test("normalizes timeout message in Spanish", async () => {
    const abort = new DOMException("Aborted", "AbortError");
    Object.defineProperty(global, "fetch", {
      value: jest.fn().mockRejectedValue(abort),
      writable: true,
      configurable: true,
    });
    await expect(analyzeApplication({ tenantId, applicationId })).rejects.toMatchObject({
      message: "El análisis tomó más tiempo del esperado. Intenta de nuevo.",
      status: 408,
    });
  });

  test("throws CreditCoreApiError for backend errors", async () => {
    mockFetchSequence({ body: { detail: { message: "No se pudo completar" } }, ok: false, status: 500 });
    await expect(analyzeApplication({ tenantId, applicationId })).rejects.toBeInstanceOf(CreditCoreApiError);
  });
});
