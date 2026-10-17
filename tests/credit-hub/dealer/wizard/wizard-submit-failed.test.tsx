import { webcrypto } from "node:crypto";
import { act, render } from "@testing-library/react";
import {
  DealerWizardProvider,
  useDealerWizard,
  type DealerWizardContextValue,
} from "@/components/forge/credit-hub/dealer/DealerWizardProvider";
import { executeMultiLender } from "@/lib/credit-hub/api/creditCoreClient";

const mockPush = jest.fn();
const mockToastSuccess = jest.fn();
const APP_ID = "app-draft-1";
const TENANT = "tenant-qa-1";
const DRAFT_KEY = "wizard-draft:test";

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush, replace: jest.fn() }),
  usePathname: () => "/credit-hub/dealer/applications/new/revision",
  useSearchParams: () => new URLSearchParams(`application_id=${APP_ID}`),
}));
jest.mock("@/hooks/useAuth", () => ({ useAuth: () => ({ user: { id: "user-1" } }) }));
jest.mock("@/lib/credit-hub/hooks/useTenant", () => ({ useTenant: () => ({ tenantId: TENANT }) }));
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
jest.mock("@/lib/credit-hub/i18n/useTranslations", () => ({
  useTranslations: () => ({
    validation: { consents_required: "Consentimientos requeridos" },
    toasts: { application_failed: "Fallo" },
  }),
}));
jest.mock("@/components/forge", () => ({
  toast: { success: (...a: unknown[]) => mockToastSuccess(...a), error: jest.fn(), info: jest.fn() },
}));
jest.mock("@/lib/credit-hub/dealer/wizard-draft-storage", () => ({
  buildWizardDraftStorageKey: () => "wizard-draft:test",
  purgeLegacyGlobalWizardDraftKeys: jest.fn(),
  WIZARD_AUTOSAVE_TOAST_SESSION_KEY: "autosave-toast",
}));
jest.mock("@/components/credit-hub/dealer/wizard/WizardContainer", () => ({
  ...jest.requireActual("@/components/credit-hub/dealer/wizard/WizardContainer"),
  stepIsValid: () => true,
}));
jest.mock("@/lib/credit-hub/dealer/wizard-gates", () => ({
  ...jest.requireActual("@/lib/credit-hub/dealer/wizard-gates"),
  wizardDocumentsStepValid: () => true,
}));
jest.mock("@/lib/credit-hub/dealer/wizard-field-errors", () => ({
  getWizardSegmentValidation: () => ({ ok: true }),
  logPersonalReferencesDebug: jest.fn(),
  scrollToFirstWizardError: jest.fn(),
  wizardBlockReasonMessage: () => "",
}));
jest.mock("@/lib/credit-hub/api/operationalClient", () => ({
  patchApplicationFields: jest.fn().mockResolvedValue({}),
}));
jest.mock("@/lib/credit-api", () => ({ uploadDocument: jest.fn() }));
jest.mock("@/lib/credit-hub/api/creditCoreClient", () => ({
  ...jest.requireActual("@/lib/credit-hub/api/creditCoreClient"),
  createDraftApplication: jest.fn(),
  getApplication: jest.fn().mockReturnValue(new Promise(() => undefined)),
  saveApplicantApplication: jest.fn().mockResolvedValue({}),
  saveVehicleApplication: jest.fn().mockResolvedValue({}),
  executeMultiLender: jest.fn(),
  getDocumentCompleteness: jest.fn().mockResolvedValue({ total_required: 0, total_uploaded: 0, missing: [], complete: true }),
}));

const mockExecute = executeMultiLender as jest.Mock;

let ctx: DealerWizardContextValue;
function Probe() {
  ctx = useDealerWizard();
  return null;
}

async function submit(): Promise<unknown> {
  let outcome: unknown = "pending";
  await act(async () => {
    try {
      outcome = await ctx.submitApplication();
    } catch (err) {
      outcome = err;
    }
  });
  return outcome;
}

beforeEach(() => {
  jest.clearAllMocks();
  Object.defineProperty(globalThis, "crypto", { value: webcrypto, configurable: true });
  localStorage.clear();
  localStorage.setItem(DRAFT_KEY, JSON.stringify({ marker: "borrador" }));
  global.fetch = jest.fn().mockResolvedValue({ ok: false }) as unknown as typeof fetch;
  render(
    <DealerWizardProvider>
      <Probe />
    </DealerWizardProvider>,
  );
});

describe("submitApplication con executeMultiLender", () => {
  test("status failed: rechaza, conserva el borrador y muestra el error", async () => {
    mockExecute.mockResolvedValue({ status: "failed", errors: [{ lender: "x" }], execution_id: "exec-1" });
    const outcome = await submit();
    expect(outcome).toBeInstanceOf(Error);
    expect((outcome as Error).message).toMatch(/No se pudo procesar la solicitud/);
    expect(localStorage.getItem(DRAFT_KEY)).not.toBeNull();
    expect(mockToastSuccess).not.toHaveBeenCalled();
    expect(mockPush).not.toHaveBeenCalled();
    expect(ctx.submitError).not.toBeNull();
    expect(ctx.isSubmitting).toBe(false);
  });

  test("estado no reconocido o ausente también falla", async () => {
    mockExecute.mockResolvedValueOnce({});
    expect(await submit()).toBeInstanceOf(Error);
    mockExecute.mockResolvedValueOnce({ status: "in_progress" });
    expect(await submit()).toBeInstanceOf(Error);
    expect(localStorage.getItem(DRAFT_KEY)).not.toBeNull();
  });

  test("reintento tras failed con el mismo application_id llega al éxito", async () => {
    mockExecute.mockResolvedValueOnce({ status: "failed", errors: [] });
    expect(await submit()).toBeInstanceOf(Error);
    mockExecute.mockResolvedValueOnce({ status: "completed", offers: [{ id: "o1" }] });
    const ok = await submit();
    expect(ok).toEqual({ application_id: APP_ID });
    expect(mockExecute).toHaveBeenCalledTimes(2);
    expect(mockExecute.mock.calls[1][0].applicationId).toBe(APP_ID);
    expect(localStorage.getItem(DRAFT_KEY)).toBeNull();
    expect(ctx.submitError).toBeNull();
  });

  test.each(["completed", "partial"])("status %s no cambia el flujo", async (status) => {
    mockExecute.mockResolvedValue({ status, offers: [{ id: "o1" }] });
    expect(await submit()).toEqual({ application_id: APP_ID });
    expect(localStorage.getItem(DRAFT_KEY)).toBeNull();
  });
});
