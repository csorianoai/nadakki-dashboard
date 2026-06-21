"use client";

import { useState } from "react";
import { useTranslations } from "@/lib/credit-hub/i18n/useTranslations";
import { useConsentApi } from "@/lib/credit-hub/hooks/useConsentApi";
import { forgeToast } from "@/components/credit-hub/system/ForgeToaster";

const PHONE_RE = /^\+\d{1,3}[-\s]?\d{3,4}[-\s]?\d{3}[-\s]?\d{4}$/;

interface SMSOTPConsentMethodProps {
  applicationId: string;
  applicationReady: boolean;
  onOtpSent?: () => void;
  dealerOtpCode: string;
  onDealerOtpCodeChange: (value: string) => void;
  onComplete?: (data: { method: string; auditHash?: string }) => void;
  consentsAccepted: string[];
  fullName: string;
  onFullNameChange: (value: string) => void;
}

export function SMSOTPConsentMethod({
  applicationId,
  applicationReady,
  onOtpSent,
  dealerOtpCode,
  onDealerOtpCodeChange,
  onComplete,
  consentsAccepted,
  fullName,
  onFullNameChange,
}: SMSOTPConsentMethodProps) {
  const t = useTranslations();
  const api = useConsentApi();
  const [phone, setPhone] = useState("");
  const [sent, setSent] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [verifyError, setVerifyError] = useState<string | null>(null);

  const validPhone = PHONE_RE.test(phone);

  const handleSend = async () => {
    if (!validPhone || !api || submitting || !applicationReady) return;
    setSubmitting(true);
    setError(null);
    setVerifyError(null);
    try {
      const result = await api.initiate(applicationId, "SMS_OTP", { phone });
      if (result.token) {
        setToken(result.token);
      }
      setSent(true);
      onOtpSent?.();
      forgeToast.success(t.consent.otp_sent_success);
    } catch (e) {
      setError(e instanceof Error ? e.message : t.consent.send_failed);
    } finally {
      setSubmitting(false);
    }
  };

  const handleResend = () => {
    setSent(false);
    setToken(null);
    setVerifyError(null);
    onDealerOtpCodeChange("");
  };

  const handleVerify = async () => {
    if (!api || !token || dealerOtpCode.length !== 6 || verifying) return;
    setVerifying(true);
    setVerifyError(null);
    try {
      const result = await api.accept(token, {
        otp_code: dealerOtpCode,
        consents_accepted: consentsAccepted,
        full_name: fullName,
      });
      onComplete?.({ method: "SMS_OTP", auditHash: result.audit_hash });
    } catch (e) {
      const msg = e instanceof Error ? e.message : t.consent.send_failed;
      setVerifyError(msg);
    } finally {
      setVerifying(false);
    }
  };

  const canVerify =
    dealerOtpCode.length === 6 &&
    !!token &&
    fullName.trim().length > 0 &&
    consentsAccepted.length > 0 &&
    !verifying;

  return (
    <div className="mt-3 space-y-3" data-testid="sms-otp-method">
      <div>
        <label className="text-sm font-medium text-forge-text" htmlFor="sms-otp-phone">
          {t.consent.phone_label} *
        </label>
        <input
          id="sms-otp-phone"
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder={t.consent.phone_placeholder}
          className="mt-1 h-11 w-full rounded-lg border border-forge-border bg-forge-surface px-3 text-sm text-forge-text"
          data-testid="sms-phone-input"
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
        disabled={!validPhone || submitting || !applicationReady || sent}
        className="rounded-lg bg-forge-success px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:bg-forge-surface-elevated disabled:text-forge-text-muted"
        data-testid="sms-send-otp"
      >
        {submitting ? t.common.saving : t.consent.send_otp}
      </button>

      {sent && (
        <div className="space-y-3 rounded-lg border border-forge-border bg-forge-surface-elevated p-3">
          <label className="text-sm font-medium text-forge-text" htmlFor="dealer-otp">
            {t.consent.otp_input_label}
          </label>
          <input
            id="dealer-otp"
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            value={dealerOtpCode}
            onChange={(e) => onDealerOtpCodeChange(e.target.value.replace(/\D/g, "").slice(0, 6))}
            className="h-11 w-full max-w-xs rounded-lg border border-forge-border bg-forge-surface px-3 text-sm tabular-nums text-forge-text"
            data-testid="sms-dealer-otp-input"
          />

          <div>
            <label className="text-sm font-medium text-forge-text" htmlFor="sms-otp-full-name">
              {t.consent.signature_label} *
            </label>
            <input
              id="sms-otp-full-name"
              type="text"
              value={fullName}
              onChange={(e) => onFullNameChange(e.target.value)}
              placeholder={t.consent.public?.full_name_placeholder ?? ""}
              className="mt-1 h-11 w-full rounded-lg border border-forge-border bg-forge-surface px-3 text-sm text-forge-text"
              data-testid="sms-otp-full-name"
            />
          </div>

          {verifyError && (
            <p className="text-xs text-forge-danger" role="alert" data-testid="sms-verify-error">
              {verifyError}
            </p>
          )}

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => void handleVerify()}
              disabled={!canVerify}
              className="rounded-lg bg-forge-primary px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:bg-forge-surface-elevated disabled:text-forge-text-muted"
              data-testid="sms-verify-otp"
            >
              {verifying ? t.common.saving : t.consent.verify_otp}
            </button>

            <button
              type="button"
              onClick={handleResend}
              className="text-sm text-forge-primary hover:underline"
              data-testid="sms-resend-otp"
            >
              {t.consent.resend}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
