"use client";

import { useState } from "react";
import { useTranslations } from "@/lib/credit-hub/i18n/useTranslations";
import { useConsentApi } from "@/lib/credit-hub/hooks/useConsentApi";
import { ConsentStatusPoller } from "./ConsentStatusPoller";
import { forgeToast } from "@/components/credit-hub/system/ForgeToaster";

const PHONE_RE = /^\+\d{1,3}[-\s]?\d{3,4}[-\s]?\d{3}[-\s]?\d{4}$/;

interface WhatsAppConsentMethodProps {
  applicationId: string;
  applicationReady: boolean;
  onComplete?: (data: { method: string; auditHash?: string }) => void;
}

export function WhatsAppConsentMethod({ applicationId, applicationReady, onComplete }: WhatsAppConsentMethodProps) {
  const t = useTranslations();
  const api = useConsentApi();
  const [phone, setPhone] = useState("");
  const [token, setToken] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validPhone = PHONE_RE.test(phone);

  const handleSend = async () => {
    if (!validPhone || !api || submitting || !applicationReady) return;
    setSubmitting(true);
    setError(null);
    try {
      const result = await api.initiate(applicationId, "WHATSAPP", { phone });
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
    <div className="mt-3 space-y-3" data-testid="whatsapp-method">
      {!token && (
        <>
          <div>
            <label className="text-sm font-medium text-forge-text" htmlFor="whatsapp-phone">
              {t.consent.phone_label} *
            </label>
            <input
              id="whatsapp-phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder={t.consent.phone_placeholder}
              className="mt-1 h-11 w-full rounded-lg border border-forge-border bg-forge-surface px-3 text-sm text-forge-text"
              data-testid="whatsapp-phone-input"
            />
            {phone && !validPhone && (
              <p className="mt-1 text-xs text-forge-danger" role="alert">
                {t.consent.invalid_phone}
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
            disabled={!validPhone || submitting || !applicationReady}
            className="rounded-lg bg-forge-success px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:bg-forge-surface-elevated disabled:text-forge-text-muted"
            data-testid="whatsapp-send"
          >
            {submitting ? t.common.saving : t.consent.send_link}
          </button>
        </>
      )}

      {token && <ConsentStatusPoller token={token} method="WHATSAPP" onComplete={onComplete} />}
    </div>
  );
}
