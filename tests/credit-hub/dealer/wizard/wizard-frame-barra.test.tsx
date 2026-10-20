import { render, screen } from "@testing-library/react";
import { DealerWizardFrame } from "@/components/credit-hub/dealer/wizard/DealerWizardFrame";

jest.mock("next/navigation", () => ({ useRouter: () => ({ push: jest.fn() }) }));
jest.mock("@/lib/credit-hub/hooks/useTenantConfig", () => ({ useTenantConfig: () => ({ tenantConfig: { locale: "es-DO" } }) }));
jest.mock("@/lib/credit-hub/i18n/useTranslations", () => ({ useTranslations: () => ({}) }));
jest.mock("@/lib/credit-hub/dealer/wizard-completeness", () => ({
  computeWizardCompleteness: () => 40,
  missingFieldsHint: () => ["Consentimiento pendiente"],
}));
jest.mock("@/components/forge/credit-hub/dealer/DealerWizardProvider", () => ({
  useDealerWizard: () => ({
    stepIndex: 1,
    isDirty: false,
    goPrev: jest.fn(),
    saveDraftToStorage: jest.fn(),
    submitApplication: jest.fn(),
    canAdvance: false,
    isSubmitting: false,
    submitError: "No se pudo firmar",
    formData: {},
    validationConfig: {},
    attemptAdvance: jest.fn(),
    blockReason: "Completa los campos obligatorios para continuar.",
    fieldErrors: {},
    showValidationErrors: true,
    consentApplicationId: "app-1",
  }),
}));

// Ronda 3 de Cowork (20-oct): a 551 px de alto la barra fija tapaba el botón Confirmar del consentimiento.
it("la barra de acciones ocupa su sitio al final (sticky) y no tapa el contenido", () => {
  render(
    <DealerWizardFrame>
      <button type="button">Confirmar</button>
    </DealerWizardFrame>
  );
  const barra = screen.getByTestId("dealer-wizard-actions");
  expect(barra.style.position).toBe("sticky");
  expect(barra.style.bottom).toBe("0px");
});
