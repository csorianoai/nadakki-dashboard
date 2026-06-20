"use client";

import { useTranslations } from "@/lib/credit-hub/i18n/useTranslations";
import { useTenantConfig } from "@/lib/credit-hub/hooks/useTenantConfig";
import { PresentConsentForm } from "./PresentConsentForm";
import { RemoteConsentSelector } from "./RemoteConsentSelector";
import { normalizeRemoteConsentMethods } from "./consent-method-map";

export type ConsentWizardPatch = Partial<{
  consent_presence: "present" | "remote";
  consent_bureau_authorization: boolean;
  consent_terms_accepted: boolean;
  consent_data_processing_authorization: boolean;
  consent_signature_full_name: string;
  consent_present_confirmed: boolean;
  consent_method: string;
  consent_audit_hash: string;
  consent_accepted_at: string;
  consent_sms_otp_sent: boolean;
  consent_dealer_otp_code: string;
}>;

interface ConsentSectionProps {
  applicationId: string;
  applicationIdReady: boolean;
  consent_presence: "present" | "remote";
  consent_bureau_authorization: boolean;
  consent_terms_accepted: boolean;
  consent_data_processing_authorization: boolean;
  consent_signature_full_name: string;
  consent_present_confirmed: boolean;
  consent_method: string;
  consent_audit_hash: string;
  consent_accepted_at: string;
  consent_sms_otp_sent: boolean;
  consent_dealer_otp_code: string;
  onPatch: (patch: ConsentWizardPatch) => void;
}

export function ConsentSection({
  applicationId,
  applicationIdReady,
  consent_presence,
  consent_bureau_authorization,
  consent_terms_accepted,
  consent_data_processing_authorization,
  consent_signature_full_name,
  consent_audit_hash,
  consent_dealer_otp_code,
  onPatch,
}: ConsentSectionProps) {
  const t = useTranslations();
  const { tenantConfig } = useTenantConfig();

  const enabledRemote = normalizeRemoteConsentMethods(tenantConfig?.consent_methods_enabled ?? []);

  const resetRemoteFields = (): ConsentWizardPatch => ({
    consent_method: "",
    consent_audit_hash: "",
    consent_accepted_at: "",
    consent_sms_otp_sent: false,
    consent_dealer_otp_code: "",
    consent_present_confirmed: false,
  });

  const setPresence = (next: "present" | "remote") => {
    onPatch({
      consent_presence: next,
      ...resetRemoteFields(),
      ...(next === "remote" ? { consent_present_confirmed: false } : {}),
    });
  };

  // Build consents_accepted list from checked checkboxes for SMS OTP accept()
  const consentsAccepted: string[] = [];
  if (consent_bureau_authorization) consentsAccepted.push("bureau_authorization");
  if (consent_terms_accepted) consentsAccepted.push("terms_accepted");
  if (consent_data_processing_authorization) consentsAccepted.push("data_processing_authorization");

  return (
    <section className="space-y-6" data-testid="consent-section">
      <div>
        <h2 className="font-display text-xl font-semibold text-forge-text">{t.consent.step_title}</h2>
      </div>

      <fieldset className="space-y-3">
        <legend className="text-sm font-medium text-forge-text">{t.consent.presence_question}</legend>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-forge-border bg-forge-surface-elevated p-4 hover:border-forge-primary/50">
            <input
              type="radio"
              name="consent-presence"
              value="present"
              checked={consent_presence === "present"}
              onChange={() => setPresence("present")}
              className="text-forge-primary"
            />
            <span className="text-sm text-forge-text">{t.consent.presence_present}</span>
          </label>
          <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-forge-border bg-forge-surface-elevated p-4 hover:border-forge-primary/50">
            <input
              type="radio"
              name="consent-presence"
              value="remote"
              checked={consent_presence === "remote"}
              onChange={() => setPresence("remote")}
              className="text-forge-primary"
            />
            <span className="text-sm text-forge-text">{t.consent.presence_remote}</span>
          </label>
        </div>
      </fieldset>

      {consent_presence === "present" && (
        <PresentConsentForm
          bureauAccepted={consent_bureau_authorization}
          termsAccepted={consent_terms_accepted}
          dataProcessingAccepted={consent_data_processing_authorization}
          onBureauChange={(v) => onPatch({ consent_bureau_authorization: v, consent_present_confirmed: false })}
          onTermsChange={(v) => onPatch({ consent_terms_accepted: v, consent_present_confirmed: false })}
          onDataProcessingChange={(v) => onPatch({ consent_data_processing_authorization: v, consent_present_confirmed: false })}
          signatureFullName={consent_signature_full_name}
          onSignatureChange={(v) => onPatch({ consent_signature_full_name: v, consent_present_confirmed: false })}
          onPresentConfirmed={() => {
            onPatch({
              consent_present_confirmed: true,
              consent_method: "PRESENT",
              consent_accepted_at: new Date().toISOString(),
              consent_audit_hash: consent_audit_hash || "",
            });
          }}
        />
      )}

      {consent_presence === "remote" && (
        <>
          <div className="space-y-3">
            <p className="text-sm text-forge-text-muted">{t.consent.present_intro}</p>
            <label className="flex items-start gap-3 rounded-xl border border-forge-border bg-forge-surface-elevated p-3 text-sm text-forge-text">
              <input
                type="checkbox"
                checked={consent_terms_accepted}
                onChange={(e) => onPatch({ consent_terms_accepted: e.target.checked })}
                className="mt-1"
              />
              <span>{t.consent.consent_ley_172_13_label} *</span>
            </label>
            <label className="flex items-start gap-3 rounded-xl border border-forge-border bg-forge-surface-elevated p-3 text-sm text-forge-text">
              <input
                type="checkbox"
                checked={consent_bureau_authorization}
                onChange={(e) => onPatch({ consent_bureau_authorization: e.target.checked })}
                className="mt-1"
              />
              <span>{t.consent.consent_buro_label} *</span>
            </label>
            <label className="flex items-start gap-3 rounded-xl border border-forge-border bg-forge-surface-elevated p-3 text-sm text-forge-text">
              <input
                type="checkbox"
                checked={consent_data_processing_authorization}
                onChange={(e) => onPatch({ consent_data_processing_authorization: e.target.checked })}
                className="mt-1"
              />
              <span>{t.consent.consent_data_policy_label} *</span>
            </label>
          </div>
        <RemoteConsentSelector
          applicationId={applicationId}
          applicationReady={applicationIdReady}
          enabledMethods={enabledRemote}
          onRemoteComplete={(data) => {
            onPatch({
              consent_method: data.method,
              consent_audit_hash: data.auditHash ?? "",
              consent_accepted_at: new Date().toISOString(),
            });
          }}
          dealerOtpCode={consent_dealer_otp_code}
          onDealerOtpCodeChange={(v) => onPatch({ consent_dealer_otp_code: v })}
          onSmsOtpSent={() => onPatch({ consent_sms_otp_sent: true, consent_method: "SMS_OTP" })}
          consentsAccepted={consentsAccepted}
          fullName={consent_signature_full_name}
          onFullNameChange={(v) => onPatch({ consent_signature_full_name: v })}
        />
        </>
      )}
    </section>
  );
}
