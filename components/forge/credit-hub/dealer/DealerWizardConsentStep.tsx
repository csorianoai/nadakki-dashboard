"use client";

import type { ApplicationFormData } from "@/components/credit-hub/dealer/wizard/WizardContainer";
import { ConsentSection, type ConsentWizardPatch } from "@/components/credit-hub/dealer/wizard/consent/ConsentSection";
import { useDealerWizard } from "./DealerWizardProvider";

export function DealerWizardConsentStep() {
  const { formData, patchForm, consentApplicationId, consentApplicationIdReady, showValidationErrors, fieldErrors } = useDealerWizard();

  const consentErrors = showValidationErrors ? Object.entries(fieldErrors) : [];

  return (
    <div className="space-y-4">
      <p className="text-forge-xs text-forgeGray-500">
        Al enviar, se registra marca de tiempo ISO 8601, hash de auditoría (incluye resumen cifrado de la firma) y, cuando la red lo permite, la IP obtenida vía{" "}
        <code className="rounded bg-forgeSurface-sunken px-1">/api/credit-hub/client-metadata</code> en el servidor.
      </p>
      {consentErrors.length > 0 ? (
        <div className="rounded-forge-md border border-forgeDanger-500 bg-forgeDanger-500/10 p-3 space-y-1" aria-invalid="true">
          {consentErrors.map(([key, msg]) => (
            <p key={key} className="text-forge-xs text-forgeDanger-600">{msg}</p>
          ))}
        </div>
      ) : null}
      <ConsentSection
        applicationId={consentApplicationId}
        applicationIdReady={consentApplicationIdReady}
        consent_presence={formData.consent_presence}
        consent_bureau_authorization={formData.consent_bureau_authorization}
        consent_terms_accepted={formData.consent_terms_accepted}
        consent_data_processing_authorization={formData.consent_data_processing_authorization}
        consent_signature_full_name={formData.consent_signature_full_name}
        consent_present_confirmed={formData.consent_present_confirmed}
        consent_method={formData.consent_method}
        consent_audit_hash={formData.consent_audit_hash}
        consent_accepted_at={formData.consent_accepted_at}
        consent_sms_otp_sent={formData.consent_sms_otp_sent}
        consent_dealer_otp_code={formData.consent_dealer_otp_code}
        onPatch={(patch: ConsentWizardPatch) => patchForm(patch as Partial<ApplicationFormData>)}
      />
    </div>
  );
}
