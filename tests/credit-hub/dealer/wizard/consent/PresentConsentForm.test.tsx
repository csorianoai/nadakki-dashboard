import { render, screen } from "@testing-library/react";
import { PresentConsentForm } from "@/components/credit-hub/dealer/wizard/consent/PresentConsentForm";
import { useTenantConfig } from "@/lib/credit-hub/hooks/useTenantConfig";

jest.mock("@/lib/credit-hub/hooks/useTenantConfig", () => ({ useTenantConfig: jest.fn() }));

jest.mock("@/lib/credit-hub/i18n/useTranslations", () => ({
  useTranslations: () => ({
    common: { confirm: "Confirmar" },
    consent: {
      present_intro: "Intro",
      consent_ley_172_13_label: "Ley",
      consent_buro_label: "Buró",
      consent_data_policy_label: (n: string) => `Datos ${n}`,
      signature_label: "Firma",
      signature_date: "Fecha:",
      signature_required: "Firma obligatoria",
      consents_required: "Consentimientos obligatorios",
      legal_text_version_label: "Versión:",
      legal_text_missing: "Texto no disponible",
      public: { submitting: "Procesando" },
    },
  }),
}));

const LEGAL_TEXT = "  Texto del backend\n  {{sin tocar}}  línea 2\n";

function renderForm(props: Partial<React.ComponentProps<typeof PresentConsentForm>> = {}) {
  return render(
    <PresentConsentForm
      bureauAccepted
      termsAccepted
      dataProcessingAccepted
      onBureauChange={jest.fn()}
      onTermsChange={jest.fn()}
      onDataProcessingChange={jest.fn()}
      signatureFullName="Persona Prueba"
      onSignatureChange={jest.fn()}
      onPresentConfirmed={jest.fn()}
      {...props}
    />
  );
}

describe("PresentConsentForm", () => {
  beforeEach(() => {
    (useTenantConfig as unknown as jest.Mock).mockReturnValue({ tenantConfig: { institution_name: "Banco QA", locale: "es-DO" } });
  });

  it("pinta el texto y la versión exactamente como los entrega el backend y permite firmar", () => {
    renderForm({ legalText: LEGAL_TEXT, legalTextVersion: "1.0" });
    expect(screen.getByTestId("present-legal-text").textContent).toBe(LEGAL_TEXT);
    expect(screen.getByTestId("present-legal-text-version")).toHaveTextContent("1.0");
    expect(screen.getByTestId("present-submit")).toBeEnabled();
  });

  it("sin texto legal no permite firmar y muestra el motivo", () => {
    renderForm({ legalText: null, legalTextError: "Motivo del backend" });
    expect(screen.getByTestId("present-legal-text-missing")).toHaveTextContent("Motivo del backend");
    expect(screen.queryByTestId("present-legal-text")).toBeNull();
    expect(screen.getByTestId("present-submit")).toBeDisabled();
  });

  it("sin texto ni motivo usa el mensaje por defecto", () => {
    renderForm({ legalText: "" });
    expect(screen.getByTestId("present-legal-text-missing")).toHaveTextContent("Texto no disponible");
    expect(screen.getByTestId("present-submit")).toBeDisabled();
  });
});
