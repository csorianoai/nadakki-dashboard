"use client";

import { useTranslations } from "@/lib/credit-hub/i18n/useTranslations";
import { useTenantConfig } from "@/lib/credit-hub/hooks/useTenantConfig";

export interface PresentConsentFormProps {
  bureauAccepted: boolean;
  termsAccepted: boolean;
  dataProcessingAccepted: boolean;
  onBureauChange: (v: boolean) => void;
  onTermsChange: (v: boolean) => void;
  onDataProcessingChange: (v: boolean) => void;
  signatureFullName: string;
  onSignatureChange: (v: string) => void;
  onPresentConfirmed: () => void;
}

export function PresentConsentForm({
  bureauAccepted,
  termsAccepted,
  dataProcessingAccepted,
  onBureauChange,
  onTermsChange,
  onDataProcessingChange,
  signatureFullName,
  onSignatureChange,
  onPresentConfirmed,
}: PresentConsentFormProps) {
  const t = useTranslations();
  const { tenantConfig } = useTenantConfig();

  const allAccepted = bureauAccepted && termsAccepted && dataProcessingAccepted;
  const canSubmit = allAccepted && signatureFullName.trim().length >= 3;

  const today = new Date().toLocaleDateString(tenantConfig?.locale ?? "es-DO");

  return (
    <div className="mt-4 space-y-4 border-l-2 border-forge-primary/50 pl-6" data-testid="present-consent-form">
      <p className="text-sm text-forge-text-muted">{t.consent.present_intro}</p>

      <div className="space-y-3">
        <label className="flex items-start gap-3 rounded-xl border border-forge-border bg-forge-surface-elevated p-3 text-sm text-forge-text">
          <input
            type="checkbox"
            checked={termsAccepted}
            onChange={(e) => onTermsChange(e.target.checked)}
            className="mt-1"
          />
          <span>{t.consent.consent_ley_172_13_label} *</span>
        </label>
        <label className="flex items-start gap-3 rounded-xl border border-forge-border bg-forge-surface-elevated p-3 text-sm text-forge-text">
          <input
            type="checkbox"
            checked={bureauAccepted}
            onChange={(e) => onBureauChange(e.target.checked)}
            className="mt-1"
          />
          <span>{t.consent.consent_buro_label} *</span>
        </label>
        <label className="flex items-start gap-3 rounded-xl border border-forge-border bg-forge-surface-elevated p-3 text-sm text-forge-text">
          <input
            type="checkbox"
            checked={dataProcessingAccepted}
            onChange={(e) => onDataProcessingChange(e.target.checked)}
            className="mt-1"
          />
          <span>{t.consent.consent_data_policy_label(tenantConfig.institution_name)} *</span>
        </label>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-forge-text" htmlFor="consent-signature-name">
          {t.consent.signature_label} *
        </label>
        <input
          id="consent-signature-name"
          type="text"
          value={signatureFullName}
          onChange={(e) => onSignatureChange(e.target.value)}
          className="h-11 w-full rounded-lg border border-forge-border bg-forge-surface px-3 text-sm text-forge-text"
        />
        <p className="text-xs text-forge-text-muted">
          {t.consent.signature_date}{" "}
          <span className="tabular-nums">{today}</span>
        </p>
      </div>

      {!canSubmit && (
        <p className="text-xs text-forge-warning" role="status">
          {!allAccepted ? t.consent.consents_required : t.consent.signature_required}
        </p>
      )}

      <button
        type="button"
        onClick={() => onPresentConfirmed()}
        disabled={!canSubmit}
        className="rounded-lg bg-forge-primary px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:bg-forge-surface-elevated disabled:text-forge-text-muted"
        data-testid="present-submit"
      >
        {t.common.confirm}
      </button>
    </div>
  );
}
