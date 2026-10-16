"use client";

import { useState } from "react";
import { CONSENT_NOTICES } from "./consent-notices";
import { useTranslations } from "@/lib/credit-hub/i18n/useTranslations";
import { useConsentApi } from "@/lib/credit-hub/hooks/useConsentApi";
import { ConsentChannelUnavailableError, isConfirmedSent } from "@/lib/credit-hub/api/consent-client";
import { ConsentStatusPoller } from "./ConsentStatusPoller";
import { forgeToast } from "@/components/credit-hub/system/ForgeToaster";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface EmailConsentMethodProps {
  applicationId: string;
  applicationReady: boolean;
  onComplete?: (data: { method: string; auditHash?: string }) => void;
  /** Alternativa ofrecida cuando el backend marca el canal como no disponible. */
  onUsePresent?: () => void;
}

export function EmailConsentMethod({ applicationId, applicationReady, onComplete, onUsePresent }: EmailConsentMethodProps) {
  const t = useTranslations();
  const api = useConsentApi();
  const [email, setEmail] = useState("");
  const [token, setToken] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [unavailable, setUnavailable] = useState(false);
  const [copied, setCopied] = useState(false);

  const validEmail = EMAIL_RE.test(email.trim());

  const handleSend = async () => {
    if (!validEmail || !api || submitting || !applicationReady) return;
    setSubmitting(true);
    setError(null);
    setUnavailable(false);
    try {
      const result = await api.initiate(applicationId, "EMAIL", { email: email.trim() });
      if (result.token && isConfirmedSent(result.status)) {
        setToken(result.token);
        forgeToast.success(t.consent.link_sent_success);
      } else {
        setError(t.consent.send_failed);
      }
    } catch (e) {
      if (e instanceof ConsentChannelUnavailableError) {
        setUnavailable(true);
        setError(CONSENT_NOTICES.channel_unavailable_email);
        return;
      }
      setError(e instanceof Error ? e.message : t.consent.send_failed);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mt-3 space-y-3" data-testid="email-method">
      {!token && (
        <>
          <div>
            <label className="text-sm font-medium text-forge-text" htmlFor="consent-email">
              {t.consent.email_label} *
            </label>
            <input
              id="consent-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t.consent.email_placeholder}
              className="mt-1 h-11 w-full rounded-lg border border-forge-border bg-forge-surface px-3 text-sm text-forge-text"
              data-testid="email-input"
            />
            {email && !validEmail && (
              <p className="mt-1 text-xs text-forge-danger" role="alert">
                {t.consent.invalid_email}
              </p>
            )}
          </div>

          {error && (
            <p className="text-xs text-forge-danger" role="alert">
              {error}
            </p>
          )}

          {unavailable && onUsePresent && (
            <button
              type="button"
              onClick={onUsePresent}
              className="text-xs font-medium text-forge-primary hover:underline"
              data-testid="email-use-present"
            >
              {CONSENT_NOTICES.use_present_instead}
            </button>
          )}

          <button
            type="button"
            onClick={() => void handleSend()}
            disabled={!validEmail || submitting || !applicationReady}
            className="rounded-lg bg-forge-success px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:bg-forge-surface-elevated disabled:text-forge-text-muted"
            data-testid="email-send"
          >
            {submitting ? t.common.saving : t.consent.send_link}
          </button>
        </>
      )}

      {token && (
        <>
          <div className="space-y-2 rounded-lg border border-forge-border bg-forge-surface-elevated p-3" data-testid="email-consent-link">
            <label className="text-xs font-medium text-forge-text" htmlFor="email-consent-link-value">
              Enlace para compartir
            </label>
            <div className="flex gap-2">
              <input
                id="email-consent-link-value"
                readOnly
                value={`${window.location.origin}/consent/${encodeURIComponent(token)}`}
                className="min-w-0 flex-1 rounded-lg border border-forge-border bg-forge-surface px-2 text-xs text-forge-text"
              />
              <button
                type="button"
                className="rounded-lg border border-forge-border px-3 py-2 text-xs font-medium text-forge-text"
                onClick={() => {
                  void navigator.clipboard.writeText(`${window.location.origin}/consent/${encodeURIComponent(token)}`);
                  setCopied(true);
                }}
              >
                {copied ? "Copiado" : "Copiar"}
              </button>
            </div>
          </div>
          <ConsentStatusPoller token={token} method="EMAIL" onComplete={onComplete} />
        </>
      )}
    </div>
  );
}
