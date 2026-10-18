/**
 * DB-CODEX-25: la guarda de pasos no actúa tras un envío correcto desde /review.
 *
 * @jest-environment jsdom
 */
import { webcrypto } from "node:crypto";
import { act, render } from "@testing-library/react";
import {
  DealerWizardProvider,
  useDealerWizard,
  type DealerWizardContextValue,
} from "@/components/forge/credit-hub/dealer/DealerWizardProvider";
import { dealerWizardStepHref } from "@/components/forge/credit-hub/dealer/dealerWizardPaths";

const mockPush = jest.fn();
const mockReplace = jest.fn();
let mockPathname = "/credit-hub/dealer/applications/new/review";
let mockSearch = "application_id=app-guard-1";
let mockApplicantValid = true;

jest.mock("@/lib/credit-api", () => ({ uploadDocument: jest.fn() }));
jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush, replace: mockReplace }),
  usePathname: () => mockPathname,
  useSearchParams: () => new URLSearchParams(mockSearch),
}));
jest.mock("@/hooks/useAuth", () => ({ useAuth: () => ({ user: { id: "user-1" } }) }));
jest.mock("@/lib/credit-hub/hooks/useTenant", () => ({ useTenant: () => ({ tenantId: "tenant-qa-1" }) }));
jest.mock("@/lib/credit-hub/hooks/useTenantConfig", () => ({
  useTenantConfig: () => ({
    tenantConfig: {
      country_code: "DO",
      locale: "es-DO",
      document_types: { primary_id: "CEDULA" },
      min_age: 18,
      max_age: 100,
      features_enabled: { garante_required: false },
    },
  }),
}));
jest.mock("@/lib/credit-hub/i18n/useTranslations", () => ({ useTranslations: () => ({ validation: {}, toasts: {} }) }));
jest.mock("@/components/forge", () => ({ toast: { success: jest.fn(), error: jest.fn(), info: jest.fn(), warning: jest.fn() } }));
jest.mock("@/lib/credit-hub/dealer/wizard-draft-storage", () => ({
  ...jest.requireActual("@/lib/credit-hub/dealer/wizard-draft-storage"),
  buildWizardDraftStorageKey: () => "wizard-draft:guard",
  purgeLegacyGlobalWizardDraftKeys: jest.fn(),
}));
// Solo el paso 1 (solicitante) es controlable; el resto de pasos queda inválido.
jest.mock("@/components/credit-hub/dealer/wizard/WizardContainer", () => ({
  ...jest.requireActual("@/components/credit-hub/dealer/wizard/WizardContainer"),
  // Válido solo mientras el formulario tenga datos: el reseteo posterior al envío lo deja inválido.
  stepIsValid: (_step: number, data: { applicant_full_name: string }) => data.applicant_full_name !== "",
  wizardDocumentsStepValid: () => true,
}));
jest.mock("@/lib/credit-hub/api/creditCoreClient", () => ({
  ...jest.requireActual("@/lib/credit-hub/api/creditCoreClient"),
  assertMultiLenderSucceeded: jest.fn(),
  executeMultiLender: jest.fn().mockResolvedValue({}),
  saveApplicantApplication: jest.fn().mockResolvedValue(undefined),
  saveVehicleApplication: jest.fn().mockResolvedValue(undefined),
  patchApplicationFields: jest.fn().mockResolvedValue(undefined),
  getDocumentCompleteness: jest.fn(),
  getApplicationDraft: jest.fn().mockResolvedValue(null),
  getApplication: jest.fn().mockRejectedValue(new Error("sin red")),
  saveApplicationDraft: jest.fn().mockResolvedValue(undefined),
  deleteApplicationDraft: jest.fn().mockResolvedValue(undefined),
}));

jest.mock("@/lib/credit-hub/dealer/wizard-gates", () => ({
  ...jest.requireActual("@/lib/credit-hub/dealer/wizard-gates"),
  wizardDocumentsStepValid: () => true,
}));
jest.mock("@/lib/credit-hub/api/operationalClient", () => ({ patchApplicationFields: jest.fn().mockResolvedValue({}) }));
jest.mock("@/lib/credit-hub/dealer/wizard-submit-documents", () => ({
  ...jest.requireActual("@/lib/credit-hub/dealer/wizard-submit-documents"),
  uploadThenDispatch: async ({ dispatch }: { dispatch: () => Promise<void> }) => dispatch(),
}));

let ctx: DealerWizardContextValue;
function Probe() {
  ctx = useDealerWizard();
  return null;
}

beforeEach(() => {
  jest.clearAllMocks();
  Object.defineProperty(globalThis, "crypto", { value: webcrypto, configurable: true });
  localStorage.clear();
  sessionStorage.clear();
});

test("tras un envío correcto desde /review la guarda no hace router.replace", async () => {
  render(
    <DealerWizardProvider>
      <Probe />
    </DealerWizardProvider>,
  );
  await act(async () => undefined);
  act(() => ctx.updateField("applicant_full_name", "Solicitud QA"));
  mockReplace.mockClear(); // la redirección al montar con el formulario vacío es legítima
  await act(async () => {
    await ctx.submitApplication();
  });
  await act(async () => undefined);
  expect(mockReplace).not.toHaveBeenCalled();
});

test("tras el envío, otra solicitud en el mismo Provider vuelve a tener guarda de entrada (REJECT auditor2 12:52 sobre #962)", async () => {
  mockPathname = "/credit-hub/dealer/applications/new/review";
  mockSearch = "application_id=app-guard-1";
  // elemento nuevo en cada render: con el mismo objeto React no vuelve a renderizar el Provider
  const ui = () => (
    <DealerWizardProvider>
      <Probe />
    </DealerWizardProvider>
  );
  const { rerender } = render(ui());
  await act(async () => undefined);
  act(() => ctx.updateField("applicant_full_name", "Solicitud QA"));
  await act(async () => {
    await ctx.submitApplication();
  });
  await act(async () => undefined);
  mockReplace.mockClear();
  // Sin desmontar el Provider: «Nueva solicitud» lleva a un paso posterior con el formulario vacío.
  mockPathname = "/credit-hub/dealer/applications/new/consent";
  mockSearch = "new=1";
  rerender(ui());
  await act(async () => {
    await new Promise((r) => setTimeout(r, 0));
  });
  expect(mockReplace).toHaveBeenCalled();
  expect(mockReplace).toHaveBeenLastCalledWith(dealerWizardStepHref("applicant", ""));
  mockPathname = "/credit-hub/dealer/applications/new/review";
  mockSearch = "application_id=app-guard-1";
});
