"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslations } from "@/lib/credit-hub/i18n/useTranslations";
import { selectAdapter, type CaptureAdapter } from "@/lib/credit-hub/identity/capture-adapter";
import { runLivenessCheck, type LivenessApiResult } from "@/lib/credit-hub/identity/liveness-client";

type LivenessStep = "consent" | "capture" | "processing" | "result";

interface LivenessCaptureProps {
  applicationId: string;
  cedulaDocId?: string;
  selfieDocId?: string;
  tenantId?: string;
  onComplete: (result: LivenessApiResult) => void;
  onSkip?: () => void;
}

export function LivenessCapture({
  applicationId,
  cedulaDocId,
  selfieDocId,
  tenantId,
  onComplete,
  onSkip,
}: LivenessCaptureProps) {
  const t = useTranslations();
  const lt = t.liveness;
  const [step, setStep] = useState<LivenessStep>("consent");
  const [result, setResult] = useState<LivenessApiResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const adapterRef = useRef<CaptureAdapter | null>(null);

  useEffect(() => {
    return () => {
      adapterRef.current?.cleanup();
    };
  }, []);

  const handleConsent = useCallback(() => {
    setStep("capture");
    setError(null);
  }, []);

  const handleCapture = useCallback(async () => {
    setError(null);
    const adapter = adapterRef.current ?? selectAdapter();
    adapterRef.current = adapter;

    if (!adapter.isAvailable()) {
      setError(lt.camera_blocked);
      return;
    }

    try {
      const captured = await adapter.capture();
      setStep("processing");

      const apiResult = await runLivenessCheck(
        applicationId,
        true,
        captured.b64,
        "passive_video",
        cedulaDocId,
        selfieDocId,
        tenantId,
      );

      setResult(apiResult);
      setStep("result");
      onComplete(apiResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : lt.generic_error);
      setStep("capture");
    }
  }, [applicationId, cedulaDocId, selfieDocId, tenantId, onComplete, lt]);

  const handleRetry = useCallback(() => {
    setError(null);
    setResult(null);
    setStep("capture");
  }, []);

  const isDev = typeof process !== "undefined" && process.env.NODE_ENV !== "production";

  return (
    <section
      className="space-y-4 rounded-lg border border-forgeGray-200 bg-forgeSurface-card p-5"
      aria-labelledby="liveness-heading"
      data-testid="liveness-capture"
    >
      <h3 id="liveness-heading" className="text-lg font-semibold text-forgeGray-900">
        {lt.title}
      </h3>

      {/* CONSENT */}
      {step === "consent" && (
        <div className="space-y-3" data-testid="liveness-consent">
          <div className="rounded-md border border-amber-300/50 bg-amber-50 p-4 text-sm text-amber-900">
            <p className="font-medium">{lt.consent_title}</p>
            <p className="mt-1">{lt.consent_body}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleConsent}
              className="rounded-lg bg-forgeBrand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-forgeBrand-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-forgeBrand-400"
              data-testid="liveness-consent-accept"
            >
              {lt.consent_accept}
            </button>
            {isDev && onSkip && (
              <button
                type="button"
                onClick={onSkip}
                className="rounded-lg bg-forgeGray-100 px-4 py-2.5 text-sm font-medium text-forgeGray-600 hover:bg-forgeGray-200"
                data-testid="liveness-skip"
              >
                {lt.skip_dev}
              </button>
            )}
          </div>
        </div>
      )}

      {/* CAPTURE */}
      {step === "capture" && (
        <div className="space-y-3" data-testid="liveness-capture-step">
          <p className="text-sm text-forgeGray-600">{lt.capture_instruction}</p>
          <button
            type="button"
            onClick={() => void handleCapture()}
            className="w-full rounded-lg bg-forgeBrand-500 px-4 py-3 text-sm font-medium text-white hover:bg-forgeBrand-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-forgeBrand-400"
            data-testid="liveness-start-capture"
          >
            {lt.capture_button}
          </button>
          {error && (
            <div className="space-y-2">
              <p className="text-sm text-rose-600" role="alert" data-testid="liveness-error">
                {error}
              </p>
              <button
                type="button"
                onClick={handleRetry}
                className="rounded-lg bg-forgeGray-100 px-4 py-2 text-sm text-forgeGray-700 hover:bg-forgeGray-200"
                data-testid="liveness-retry"
              >
                {t.common.retry}
              </button>
            </div>
          )}
        </div>
      )}

      {/* PROCESSING */}
      {step === "processing" && (
        <div className="flex items-center gap-3 py-6" data-testid="liveness-processing">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-forgeBrand-500 border-t-transparent" />
          <p className="text-sm text-forgeGray-600">{lt.processing}</p>
        </div>
      )}

      {/* RESULT */}
      {step === "result" && result && (
        <div data-testid="liveness-result" data-status={result.status}>
          {result.status === "live" && (
            <div className="flex items-start gap-3 rounded-md border border-emerald-300/50 bg-emerald-50 p-4">
              <span className="text-emerald-600" aria-hidden="true">&#10003;</span>
              <div>
                <p className="text-sm font-medium text-emerald-800">{lt.result_live}</p>
                {result.pad_score != null && (
                  <p className="mt-0.5 text-xs text-emerald-600">
                    {lt.confidence}: {Math.round(result.pad_score * 100)}%
                  </p>
                )}
              </div>
            </div>
          )}

          {result.status === "needs_review" && (
            <div className="flex items-start gap-3 rounded-md border border-amber-300/50 bg-amber-50 p-4">
              <span className="text-amber-600" aria-hidden="true">&#9888;</span>
              <div>
                <p className="text-sm font-medium text-amber-800">{lt.result_needs_review}</p>
                <p className="mt-0.5 text-xs text-amber-600">{lt.result_needs_review_detail}</p>
              </div>
            </div>
          )}

          {result.status === "spoof" && (
            <div className="flex items-start gap-3 rounded-md border border-rose-300/50 bg-rose-50 p-4">
              <span className="text-rose-600" aria-hidden="true">&#10007;</span>
              <div>
                <p className="text-sm font-medium text-rose-800">{lt.result_spoof}</p>
                <p className="mt-0.5 text-xs text-rose-600">{lt.result_spoof_detail}</p>
              </div>
            </div>
          )}

          {result.status === "not_applicable" && (
            <div className="flex items-start gap-3 rounded-md border border-amber-300/50 bg-amber-50 p-4">
              <span className="text-amber-600" aria-hidden="true">&#9888;</span>
              <p className="text-sm text-amber-800">{lt.result_not_applicable}</p>
            </div>
          )}
        </div>
      )}
    </section>
  );
}

/**
 * Determine whether liveness result allows application submission.
 */
export function livenessAllowsSubmit(result: LivenessApiResult | null): boolean {
  if (!result) return false;
  return result.status === "live" || result.status === "needs_review";
}

/**
 * Determine whether to show a warning alongside the submit button.
 */
export function livenessSubmitWarning(
  result: LivenessApiResult | null,
): string | null {
  if (!result) return null;
  if (result.status === "needs_review") return "needs_review";
  if (result.status === "spoof") return "blocked";
  if (result.status === "not_applicable") return "not_applicable";
  return null;
}
