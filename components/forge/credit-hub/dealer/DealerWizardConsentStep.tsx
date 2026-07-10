"use client";

import type { ApplicationFormData } from "@/components/credit-hub/dealer/wizard/WizardContainer";
import { tenantDocumentKey } from "@/components/credit-hub/dealer/wizard/WizardContainer";
import { ConsentSection, type ConsentWizardPatch } from "@/components/credit-hub/dealer/wizard/consent/ConsentSection";
import { buildConsentDocumentsSummary } from "@/lib/credit-hub/dealer/wizard-gates";
import { SecurityVerificationToggles } from "@/components/credit-hub/dealer/wizard/SecurityVerificationToggles";
import { useDealerWizard } from "./DealerWizardProvider";

export function DealerWizardConsentStep() {
  const { formData, patchForm, consentApplicationId, consentApplicationIdReady, requiredDocumentsList } = useDealerWizard();
  const summary = buildConsentDocumentsSummary(formData, requiredDocumentsList, tenantDocumentKey);

  return (
    <div className="space-y-4">
      <section
        data-testid="documents-attachment-summary"
        className="rounded-forge-md border border-forgeGray-200 bg-forgeSurface-sunken p-4"
      >
        <h3 className="text-forge-sm font-semibold text-forgeGray-800">
          Documentos adjuntos: {summary.attachedCount} de {summary.totalCount}
        </h3>
        <ul className="mt-3 space-y-1.5 text-forge-sm">
          {summary.items.map((item) => (
            <li
              key={item.key}
              className={item.attached ? "text-forgeGray-800" : "text-forgeGray-500"}
              data-testid={`consent-doc-${item.key}`}
            >
              {item.attached ? "✓" : "—"} {item.label}
              {!item.attached ? <span className="text-forge-xs"> (no adjuntado)</span> : null}
            </li>
          ))}
        </ul>
        <p className="mt-3 text-forge-xs text-forgeGray-500">
          Los documentos no adjuntados quedarán como pendientes. El banco podrá solicitarlos después.
        </p>
      </section>

      <SecurityVerificationToggles
        formData={formData}
        patchForm={patchForm}
        applicationId={consentApplicationId}
      />

      <p className="text-forge-xs text-forgeGray-500">
        Al enviar, se registra marca de tiempo ISO 8601, hash de auditoría (incluye resumen cifrado de la firma) y, cuando la red lo permite, la IP obtenida vía{" "}
        <code className="rounded bg-forgeSurface-sunken px-1">/api/credit-hub/client-metadata</code> en el servidor.
      </p>
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
