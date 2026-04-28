"use client";

import { useState } from "react";
import { useTranslations } from "@/lib/credit-hub/i18n/useTranslations";
import { useConsentApi } from "@/lib/credit-hub/hooks/useConsentApi";
import { ConsentStatusPoller } from "./ConsentStatusPoller";
import { forgeToast } from "@/components/credit-hub/system/ForgeToaster";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface EmailConsentMethodProps {
  applicationId: string;
  applicationReady: boolean;
  onComplete?: (data: { method: string; auditHash?: string }) => void;
}

export function EmailConsentMethod({ applicationId, applicationReady, onComplete }: EmailConsentMethodProps) {
  const t = useTranslations();
  const api = useConsentApi();
  const [email, setEmail] = useState("");
  const [token, setToken] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validEmail = EMAIL_RE.test(email.trim());

  const handleSend = async () => {
    if (!validEmail || !api || submitting || !applicationReady) return;
    setSubmitting(true);
    setError(null);
    try {
      const result = await api.initiate(applicationId, "EMAIL", { email: email.trim() });
      if (result.token) {
        setToken(result.token);
        forgeToast.success(t.consent.link_sent_success);
      } else {
        setError(t.consent.send_failed);
      }
    } catch (e) {
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

      {token && <ConsentStatusPoller token={token} method="EMAIL" onComplete={onComplete} />}
    </div>
  );
}
