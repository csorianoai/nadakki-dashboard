"use client";

import { WIZARD_OPTIONAL_BUREAU_NOTICE } from "@/lib/credit-hub/dealer/wizard-optional-notices";
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
  onPresentConfirmed: () => void | Promise<void>;
  submitting?: boolean;
  submitError?: string | null;
  getFieldError?: (key: string) => string | undefined;
}

function consentLabelClass(hasError: boolean): string {
  return `flex items-start gap-3 rounded-xl border bg-forge-surface-elevated p-3 text-sm text-forge-text ${
    hasError ? "border-[#ef4444]" : "border-forge-border"
  }`;
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
  submitting = false,
  submitError,
  getFieldError,
}: PresentConsentFormProps) {
  const t = useTranslations();
  const { tenantConfig } = useTenantConfig();

  const requiredConsents = termsAccepted && dataProcessingAccepted;
  const canSubmit = requiredConsents && signatureFullName.trim().length >= 3;

  const today = new Date().toLocaleDateString(tenantConfig?.locale ?? "es-DO");

  return (
    <div className="mt-4 space-y-4 border-l-2 border-forge-primary/50 pl-6" data-testid="present-consent-form">
      <p className="text-sm text-forge-text-muted">{t.consent.present_intro}</p>

      <div className="space-y-3">
        <label className={consentLabelClass(Boolean(getFieldError?.("consent_terms_accepted")))} data-wizard-field="consent_terms_accepted">
          <input
            type="checkbox"
            checked={termsAccepted}
            onChange={(e) => onTermsChange(e.target.checked)}
            className="mt-1"
          />
          <span>{t.consent.consent_ley_172_13_label} *</span>
        </label>
        {getFieldError?.("consent_terms_accepted") ? (
          <p className="text-xs text-[#ef4444]" role="alert">{getFieldError("consent_terms_accepted")}</p>
        ) : null}
        <label className={consentLabelClass(Boolean(getFieldError?.("consent_bureau_authorization")))} data-wizard-field="consent_bureau_authorization">
          <input
            type="checkbox"
            checked={bureauAccepted}
            onChange={(e) => onBureauChange(e.target.checked)}
            className="mt-1"
          />
          <span>{t.consent.consent_buro_label}</span>
        </label>
        <p className="text-xs text-forge-text-muted">{WIZARD_OPTIONAL_BUREAU_NOTICE}</p>
        {getFieldError?.("consent_bureau_authorization") ? (
          <p className="text-xs text-[#ef4444]" role="alert">{getFieldError("consent_bureau_authorization")}</p>
        ) : null}
        <label className={consentLabelClass(Boolean(getFieldError?.("consent_data_processing_authorization")))} data-wizard-field="consent_data_processing_authorization">
          <input
            type="checkbox"
            checked={dataProcessingAccepted}
            onChange={(e) => onDataProcessingChange(e.target.checked)}
            className="mt-1"
          />
          <span>{t.consent.consent_data_policy_label(tenantConfig.institution_name)} *</span>
        </label>
        {getFieldError?.("consent_data_processing_authorization") ? (
          <p className="text-xs text-[#ef4444]" role="alert">{getFieldError("consent_data_processing_authorization")}</p>
        ) : null}
      </div>

      <div className="space-y-2" data-wizard-field="consent_signature_full_name">
        <label className="text-sm font-medium text-forge-text" htmlFor="consent-signature-name">
          {t.consent.signature_label} *
        </label>
        <input
          id="consent-signature-name"
          type="text"
          value={signatureFullName}
          onChange={(e) => onSignatureChange(e.target.value)}
          className={`h-11 w-full rounded-lg border bg-forge-surface px-3 text-sm text-forge-text ${
            getFieldError?.("consent_signature_full_name") ? "border-[#ef4444]" : "border-forge-border"
          }`}
        />
        {getFieldError?.("consent_signature_full_name") ? (
          <p className="text-xs text-[#ef4444]" role="alert">{getFieldError("consent_signature_full_name")}</p>
        ) : null}
        <p className="text-xs text-forge-text-muted">
          {t.consent.signature_date}{" "}
          <span className="tabular-nums">{today}</span>
        </p>
      </div>

      {!canSubmit && (
        <p className="text-xs text-forge-warning" role="status">
          {!requiredConsents ? t.consent.consents_required : t.consent.signature_required}
        </p>
      )}

      <button
        type="button"
        onClick={() => onPresentConfirmed()}
        disabled={!canSubmit || submitting}
        className="rounded-lg bg-forge-primary px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:bg-forge-surface-elevated disabled:text-forge-text-muted"
        data-testid="present-submit"
      >
        {submitting ? t.consent.public.submitting : t.common.confirm}
      </button>
      {submitError ? (
        <p className="text-xs text-[#ef4444]" role="alert">
          {submitError}
        </p>
      ) : null}
    </div>
  );
}
