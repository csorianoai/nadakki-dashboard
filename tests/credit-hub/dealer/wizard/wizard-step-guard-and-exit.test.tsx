/**
 * DB-CODEX-25 (b)(c): guarda de pasos por estado real y "Volver al panel" solo con cambios sin guardar.
 *
 * @jest-environment jsdom
 */
import { webcrypto } from "node:crypto";
import { act, fireEvent, render, screen } from "@testing-library/react";
import {
  DealerWizardProvider,
  useDealerWizard,
  type DealerWizardContextValue,
} from "@/components/forge/credit-hub/dealer/DealerWizardProvider";
import { DealerWizardFrame } from "@/components/credit-hub/dealer/wizard/DealerWizardFrame";
import { dealerWizardStepHref } from "@/components/forge/credit-hub/dealer/dealerWizardPaths";
import { initialApplicationFormData } from "@/components/credit-hub/dealer/wizard/WizardContainer";

const mockPush = jest.fn();
const mockReplace = jest.fn();
let mockPathname = "/credit-hub/dealer/applications/new/consent";
let mockSearch = "application_id=app-guard-1";
let mockApplicantValid = false;

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
  stepIsValid: (step: number) => mockApplicantValid && (step === 0 || step === 1),
}));
jest.mock("@/lib/credit-hub/api/creditCoreClient", () => ({
  ...jest.requireActual("@/lib/credit-hub/api/creditCoreClient"),
  getApplicationDraft: jest.fn().mockResolvedValue(null),
  getApplication: jest.fn().mockRejectedValue(new Error("sin red")),
  saveApplicationDraft: jest.fn().mockResolvedValue(undefined),
  deleteApplicationDraft: jest.fn().mockResolvedValue(undefined),
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
  mockPathname = "/credit-hub/dealer/applications/new/consent";
  mockSearch = "application_id=app-guard-1";
  mockApplicantValid = false;
});

const mount = () =>
  render(
    <DealerWizardProvider>
      <Probe />
      <DealerWizardFrame>
        <div />
      </DealerWizardFrame>
    </DealerWizardProvider>,
  );

describe("guarda de pasos", () => {
  test("/consent con el formulario vacío redirige al paso applicant conservando application_id", async () => {
    mount();
    await act(async () => undefined);
    expect(mockReplace).toHaveBeenCalledTimes(1);
    expect(mockReplace).toHaveBeenCalledWith(dealerWizardStepHref("applicant", "app-guard-1"));
    expect(String(mockReplace.mock.calls[0]![0])).toContain("application_id=app-guard-1");
  });

  test("con el paso 1 válido no redirige", async () => {
    mockApplicantValid = true;
    mount();
    await act(async () => undefined);
    expect(mockReplace).not.toHaveBeenCalled();
  });

  test("el primer paso no se guarda", async () => {
    mockPathname = "/credit-hub/dealer/applications/new/applicant";
    mount();
    await act(async () => undefined);
    expect(mockReplace).not.toHaveBeenCalled();
  });
});

describe("Volver al panel", () => {
  beforeEach(() => {
    mockApplicantValid = true;
    mockPathname = "/credit-hub/dealer/applications/new/applicant";
  });

  test("sin cambios navega directo, sin modal", async () => {
    mount();
    await act(async () => undefined);
    fireEvent.click(screen.getByText("← Volver al panel"));
    expect(mockPush).toHaveBeenCalledWith("/autos/dealer/credito");
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  test("con un campo cambiado abre el modal y no navega", async () => {
    mount();
    await act(async () => undefined);
    expect(JSON.stringify(ctx.formData)).toBe(JSON.stringify(initialApplicationFormData));
    act(() => ctx.updateField("applicant_full_name", "Cambio"));
    fireEvent.click(screen.getByText("← Volver al panel"));
    expect(mockPush).not.toHaveBeenCalled();
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });
});
