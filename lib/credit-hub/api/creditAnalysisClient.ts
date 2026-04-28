import { CreditCoreApiError } from "./creditCoreClient";
import type { CreditAnalysisResult } from "../types/creditAnalysis";

const CREDIT_CORE_BASE = "/api/v2/credit";
const REQUEST_TIMEOUT_MS = 30_000;

async function parseResponseBody(response: Response): Promise<unknown> {
  try {
    return await response.clone().json();
  } catch {
    try {
      return await response.text();
    } catch {
      return null;
    }
  }
}

function responseMessage(body: unknown, fallback: string): string {
  if (typeof body === "string" && body.trim()) return body;
  if (body && typeof body === "object") {
    const record = body as Record<string, unknown>;
    const detail = record.detail;
    if (detail && typeof detail === "object") {
      const detailRecord = detail as Record<string, unknown>;
      if (typeof detailRecord.message === "string") return detailRecord.message;
      if (typeof detailRecord.error === "string") return detailRecord.error;
    }
    if (typeof record.message === "string") return record.message;
    if (typeof record.error === "string") return record.error;
    if (typeof record.detail === "string") return record.detail;
  }
  return fallback;
}

async function creditAnalysisFetch<T>(
  path: string,
  init: Omit<RequestInit, "headers"> & { tenantId: string; headers?: Record<string, string> }
): Promise<{ data: T; headers: Headers }> {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(`${CREDIT_CORE_BASE}${path}`, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        "X-Tenant-ID": init.tenantId,
        ...(init.headers ?? {}),
      },
      signal: controller.signal,
      credentials: "include",
    });
    const body = await parseResponseBody(response);
    if (!response.ok) {
      throw new CreditCoreApiError(responseMessage(body, response.statusText), response.status, body);
    }
    return { data: body as T, headers: response.headers };
  } catch (error) {
    if (error instanceof CreditCoreApiError) throw error;
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new CreditCoreApiError("El análisis tomó más tiempo del esperado. Intenta de nuevo.", 408);
    }
    throw new CreditCoreApiError("No se pudo completar el análisis. Verifica los datos de la solicitud.", 0, error);
  } finally {
    window.clearTimeout(timeoutId);
  }
}

function sleep(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

export async function analyzeApplication(params: {
  tenantId: string;
  applicationId: string;
  max409Retries?: number;
}): Promise<CreditAnalysisResult> {
  const maxRetries = params.max409Retries ?? 3;
  let attempt = 0;
  while (true) {
    try {
      const { data } = await creditAnalysisFetch<CreditAnalysisResult>(
        `/applications/${encodeURIComponent(params.applicationId)}/analyze`,
        { method: "POST", tenantId: params.tenantId }
      );
      return data;
    } catch (error) {
      if (error instanceof CreditCoreApiError && error.status === 409 && attempt < maxRetries) {
        attempt += 1;
        await sleep(2_000);
        continue;
      }
      if (error instanceof CreditCoreApiError && error.status === 408) {
        throw error;
      }
      throw new CreditCoreApiError(
        error instanceof Error ? error.message : "No se pudo completar el análisis. Verifica los datos de la solicitud.",
        error instanceof CreditCoreApiError ? error.status : 0,
        error instanceof CreditCoreApiError ? error.detail : error
      );
    }
  }
}

export async function getApplicationAnalysis(params: {
  tenantId: string;
  applicationId: string;
}): Promise<CreditAnalysisResult> {
  const { data } = await creditAnalysisFetch<CreditAnalysisResult>(
    `/applications/${encodeURIComponent(params.applicationId)}/analysis`,
    { method: "GET", tenantId: params.tenantId }
  );
  return data;
}
