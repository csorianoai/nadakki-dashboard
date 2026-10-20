"use client";

import { useEffect, useState } from "react";
import { WIZARD_OPTIONAL_BUREAU_NOTICE } from "@/lib/credit-hub/dealer/wizard-optional-notices";
import { useTranslations } from "@/lib/credit-hub/i18n/useTranslations";
import { useConsentApi } from "@/lib/credit-hub/hooks/useConsentApi";
import { useTenantConfig } from "@/lib/credit-hub/hooks/useTenantConfig";
import {
  ConsentApiError,
  PRESENT_TEXT_CLIENT_FIELDS,
  type PresentTextField,
  type PresentTextFields,
} from "@/lib/credit-hub/api/consent-client";
import { PresentConsentDocumentFields } from "./PresentConsentDocumentFields";
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
  getFieldError?: (key: string) => string | undefined;
  /** Datos del asistente con los que se precargan las llaves del texto v1.0 (editables). */
  presentTextPrefill?: Partial<PresentTextFields>;
}

/** Sin evento PRESENT pendiente: hay que iniciarlo antes de pedir el texto. */
const PRESENT_NEEDS_INITIATE = new Set(["consent_present_not_initiated", "consent_present_not_pending"]);

function camposFrom(prefill: Partial<PresentTextFields> | undefined): PresentTextFields {
  return Object.fromEntries(PRESENT_TEXT_CLIENT_FIELDS.map((k) => [k, prefill?.[k] ?? ""])) as PresentTextFields;
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
  getFieldError,
  presentTextPrefill,
}: ConsentSectionProps) {
  const t = useTranslations();
  const { tenantConfig } = useTenantConfig();
  const consentApi = useConsentApi();
  const [presentSubmitting, setPresentSubmitting] = useState(false);
  const [presentSubmitError, setPresentSubmitError] = useState<string | null>(null);

  const [legalText, setLegalText] = useState<string | null>(null);
  const [legalTextVersion, setLegalTextVersion] = useState<string | null>(null);
  const [legalTextError, setLegalTextError] = useState<string | null>(null);
  const [legalTextLoading, setLegalTextLoading] = useState(false);
  const [campos, setCampos] = useState<PresentTextFields>(() => camposFrom(presentTextPrefill));
  // Datos con los que se emitió el texto mostrado: se firma con exactamente estos.
  const [loadedCampos, setLoadedCampos] = useState<PresentTextFields | null>(null);

  // El borrador del asistente puede hidratarse después: solo rellena llaves aún vacías.
  useEffect(() => {
    setCampos((prev) => {
      const vacias = PRESENT_TEXT_CLIENT_FIELDS.filter((k) => !prev[k].trim() && presentTextPrefill?.[k]);
      if (vacias.length === 0) return prev;
      const next = { ...prev };
      for (const k of vacias) next[k] = presentTextPrefill?.[k] as string;
      return next;
    });
  }, [presentTextPrefill]);

  const changeCampo = (key: PresentTextField, value: string) => {
    setCampos((prev) => ({ ...prev, [key]: value }));
    setLegalText(null);
    setLegalTextVersion(null);
    setLoadedCampos(null);
    onPatch({ consent_present_confirmed: false });
  };

  const loadPresentText = async () => {
    if (!applicationIdReady || !applicationId || !consentApi) {
      setLegalTextError(t.consent.application_id_required);
      return;
    }
    const pedidos = { ...campos };
    setLegalTextLoading(true);
    setLegalTextError(null);
    try {
      let r;
      try {
        r = await consentApi.fetchPresentText(applicationId, pedidos);
      } catch (e) {
        const needsInitiate =
          e instanceof ConsentApiError && (e.status === 404 || (e.code !== null && PRESENT_NEEDS_INITIATE.has(e.code)));
        if (!needsInitiate) throw e;
        await consentApi.initiate(applicationId, "PRESENT", {});
        r = await consentApi.fetchPresentText(applicationId, pedidos);
      }
      setLegalText(r.consent_text || null);
      setLegalTextVersion(r.consent_text_version || null);
      setLoadedCampos(r.consent_text ? pedidos : null);
    } catch (e) {
      setLegalText(null);
      setLoadedCampos(null);
      if (e instanceof ConsentApiError && e.code === "consent_text_incomplete") {
        setLegalTextError(`${t.consent.legal_text_missing} Faltan: ${e.missing.join(", ")}.`);
      } else {
        setLegalTextError(e instanceof Error ? e.message : null);
      }
    } finally {
      setLegalTextLoading(false);
    }
  };

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

  const confirmPresentConsent = async () => {
    if (!applicationIdReady || !applicationId || !consentApi) {
      setPresentSubmitError(t.consent.application_id_required);
      return;
    }
    if (!loadedCampos) {
      setPresentSubmitError(t.consent.legal_text_missing);
      return;
    }

    setPresentSubmitting(true);
    setPresentSubmitError(null);
    try {
      // El evento PRESENT ya se inició al cargar el texto: reiniciarlo cambiaría su identificador
      // y el texto firmado dejaría de ser el que vio el titular.
      const accepted = await consentApi.acceptPresent(applicationId, {
        consents_accepted: consentsAccepted,
        full_name: consent_signature_full_name.trim(),
        texto_campos: loadedCampos,
      });
      onPatch({
        consent_present_confirmed: true,
        consent_method: "PRESENT",
        consent_accepted_at: accepted.accepted_at ?? new Date().toISOString(),
        consent_audit_hash: accepted.audit_hash,
      });
    } catch (error) {
      setPresentSubmitError(error instanceof Error ? error.message : t.consent.public.generic_submit_error);
    } finally {
      setPresentSubmitting(false);
    }
  };

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
        <PresentConsentDocumentFields campos={campos} onChange={changeCampo} onLoad={loadPresentText} loading={legalTextLoading} />
      )}

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
          onPresentConfirmed={confirmPresentConsent}
          submitting={presentSubmitting}
          submitError={presentSubmitError}
          getFieldError={getFieldError}
          legalText={legalText}
          legalTextVersion={legalTextVersion}
          legalTextError={legalTextError}
        />
      )}

      {consent_presence === "remote" && (
        <>
          <div className="space-y-3">
            <p className="text-sm text-forge-text-muted">{t.consent.present_intro}</p>
            <label className={`flex items-start gap-3 rounded-xl border bg-forge-surface-elevated p-3 text-sm text-forge-text ${getFieldError?.("consent_terms_accepted") ? "border-[#ef4444]" : "border-forge-border"}`} data-wizard-field="consent_terms_accepted">
              <input
                type="checkbox"
                checked={consent_terms_accepted}
                onChange={(e) => onPatch({ consent_terms_accepted: e.target.checked })}
                className="mt-1"
              />
              <span>{t.consent.consent_ley_172_13_label} *</span>
            </label>
            {getFieldError?.("consent_terms_accepted") ? <p className="text-xs text-[#ef4444]" role="alert">{getFieldError("consent_terms_accepted")}</p> : null}
            <label className={`flex items-start gap-3 rounded-xl border bg-forge-surface-elevated p-3 text-sm text-forge-text ${getFieldError?.("consent_bureau_authorization") ? "border-[#ef4444]" : "border-forge-border"}`} data-wizard-field="consent_bureau_authorization">
              <input
                type="checkbox"
                checked={consent_bureau_authorization}
                onChange={(e) => onPatch({ consent_bureau_authorization: e.target.checked })}
                className="mt-1"
              />
              <span>{t.consent.consent_buro_label}</span>
            </label>
            <p className="text-xs text-forge-text-muted">{WIZARD_OPTIONAL_BUREAU_NOTICE}</p>
            {getFieldError?.("consent_bureau_authorization") ? <p className="text-xs text-[#ef4444]" role="alert">{getFieldError("consent_bureau_authorization")}</p> : null}
            <label className={`flex items-start gap-3 rounded-xl border bg-forge-surface-elevated p-3 text-sm text-forge-text ${getFieldError?.("consent_data_processing_authorization") ? "border-[#ef4444]" : "border-forge-border"}`} data-wizard-field="consent_data_processing_authorization">
              <input
                type="checkbox"
                checked={consent_data_processing_authorization}
                onChange={(e) => onPatch({ consent_data_processing_authorization: e.target.checked })}
                className="mt-1"
              />
              <span>{t.consent.consent_data_policy_label(tenantConfig.institution_name)} *</span>
            </label>
            {getFieldError?.("consent_data_processing_authorization") ? <p className="text-xs text-[#ef4444]" role="alert">{getFieldError("consent_data_processing_authorization")}</p> : null}
          </div>
        <div data-wizard-field="consent_method">
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
          onUseInPerson={() => setPresence("present")}
        />
        {getFieldError?.("consent_method") ? <p className="mt-2 text-xs text-[#ef4444]" role="alert">{getFieldError("consent_method")}</p> : null}
        </div>
        </>
      )}
    </section>
  );
}
