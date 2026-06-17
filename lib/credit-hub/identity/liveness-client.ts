"use client";

import { tokenStorage } from "@/lib/auth/token-storage";

export type LivenessStatus = "live" | "spoof" | "needs_review" | "not_applicable";

export interface LivenessApiResult {
  status: LivenessStatus;
  pad_score: number | null;
  provider: string | null;
  evidence_id: string | null;
  requires_manual_review: boolean;
  blocked: boolean;
  detail?: string | null;
}

const LEGACY_ACCESS_TOKEN_STORAGE_KEY = "nadakki_sic_token";
const REQUEST_TIMEOUT_MS = 30_000;

function readBearerAccessToken(): string | null {
  const fromAuthV2 = tokenStorage.getAccessToken();
  if (fromAuthV2) return fromAuthV2;
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(LEGACY_ACCESS_TOKEN_STORAGE_KEY);
}

export async function runLivenessCheck(
  applicationId: string,
  consentGranted: boolean,
  mediaB64: string,
  captureKind: "passive_video" | "active_challenge" | "selfie_image" = "passive_video",
  cedulaDocId?: string,
  selfieDocId?: string,
  tenantId?: string,
): Promise<LivenessApiResult> {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  const bearerAccessToken = readBearerAccessToken();

  try {
    const url = `/api/v2/credit/applications/${encodeURIComponent(applicationId)}/identity/liveness`;
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(bearerAccessToken ? { Authorization: `Bearer ${bearerAccessToken}` } : {}),
        ...(tenantId ? { "X-Tenant-ID": tenantId } : {}),
      },
      body: JSON.stringify({
        consent_granted: consentGranted,
        media_b64: mediaB64,
        capture_kind: captureKind,
        ...(cedulaDocId ? { cedula_doc_id: cedulaDocId } : {}),
        ...(selfieDocId ? { selfie_doc_id: selfieDocId } : {}),
      }),
      signal: controller.signal,
      credentials: "include",
    });

    if (!response.ok) {
      const body = await response.text().catch(() => "");
      throw new Error(`Liveness check failed: ${response.status} ${body}`);
    }

    return (await response.json()) as LivenessApiResult;
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new Error("Liveness check timed out");
    }
    throw error;
  } finally {
    window.clearTimeout(timeoutId);
  }
}
