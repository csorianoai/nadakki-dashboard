import { webcrypto } from "node:crypto";
import { act, render } from "@testing-library/react";
import {
  DealerWizardProvider,
  useDealerWizard,
  type DealerWizardContextValue,
} from "@/components/forge/credit-hub/dealer/DealerWizardProvider";
import { CreditCoreApiError, executeMultiLender, getDocumentCompleteness } from "@/lib/credit-hub/api/creditCoreClient";
import { uploadDocument } from "@/lib/credit-api";

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
const mockUpload = uploadDocument as jest.Mock;
const mockCompleteness = getDocumentCompleteness as jest.Mock;

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

const COMPLETE = { total_required: 2, total_uploaded: 2, missing: [], complete: true };
const file = (name: string) => new File(["x"], name, { type: "application/pdf" });

beforeEach(() => {
  jest.clearAllMocks();
  Object.defineProperty(globalThis, "crypto", { value: webcrypto, configurable: true });
  localStorage.clear();
  localStorage.setItem(DRAFT_KEY, JSON.stringify({ marker: "borrador" }));
  global.fetch = jest.fn().mockResolvedValue({ ok: false }) as unknown as typeof fetch;
  mockUpload.mockResolvedValue({});
  mockCompleteness.mockResolvedValue(COMPLETE);
  mockExecute.mockResolvedValue({ status: "completed", offers: [{ id: "o1" }] });
  render(
    <DealerWizardProvider>
      <Probe />
    </DealerWizardProvider>,
  );
  act(() => {
    ctx.setPendingFile("id_front", file("a.pdf"));
    ctx.setPendingFile("id_back", file("b.pdf"));
  });
});

describe("submitApplication: subir → completeness → despachar", () => {
  test("(a) una subida rechaza: no despacha, conserva el borrador y marca error", async () => {
    mockUpload.mockResolvedValueOnce({}).mockRejectedValueOnce(new Error("red caída"));
    const outcome = await submit();
    expect(outcome).toBeInstanceOf(Error);
    expect(mockExecute).not.toHaveBeenCalled();
    expect(mockCompleteness).not.toHaveBeenCalled();
    expect(localStorage.getItem(DRAFT_KEY)).not.toBeNull();
    expect(ctx.pendingFiles.get("id_back")).toMatchObject({ status: "error", errorMessage: "red caída" });
    expect(ctx.pendingFiles.get("id_front")?.status).toBe("uploaded");
  });

  test("(b) completeness incompleto: no despacha y lista los faltantes", async () => {
    mockCompleteness.mockResolvedValue({ ...COMPLETE, complete: false, missing: ["pay_stubs"] });
    const outcome = await submit();
    expect(outcome).toBeInstanceOf(Error);
    expect(mockExecute).not.toHaveBeenCalled();
    expect(ctx.submitError).toMatch(/Faltan documentos obligatorios: .+/);
    expect(localStorage.getItem(DRAFT_KEY)).not.toBeNull();
  });

  test("(c) orden: uploadDocument×N → completeness → executeMultiLender", async () => {
    const order: string[] = [];
    mockUpload.mockImplementation(async () => void order.push("upload"));
    mockCompleteness.mockImplementation(async () => (order.push("completeness"), COMPLETE));
    mockExecute.mockImplementation(async () => (order.push("execute"), { status: "completed" }));
    expect(await submit()).toEqual({ application_id: APP_ID });
    expect(order).toEqual(["upload", "upload", "completeness", "execute"]);
    expect(localStorage.getItem(DRAFT_KEY)).toBeNull();
  });

  test("(d) 409 documents_incomplete del backend se muestra y conserva el borrador", async () => {
    mockExecute.mockRejectedValue(
      new CreditCoreApiError("conflict", 409, { error: "documents_incomplete", missing: ["pay_stubs"] }),
    );
    expect(await submit()).toBeInstanceOf(Error);
    expect(ctx.submitError).toMatch(/Faltan documentos obligatorios: Últimas 3 nóminas/);
    expect(localStorage.getItem(DRAFT_KEY)).not.toBeNull();
  });

  test("(e) reintento tras (a) sube solo los fallidos y llega al éxito", async () => {
    mockUpload.mockResolvedValueOnce({}).mockRejectedValueOnce(new Error("red caída"));
    expect(await submit()).toBeInstanceOf(Error);
    mockUpload.mockClear();
    mockUpload.mockResolvedValue({});
    expect(await submit()).toEqual({ application_id: APP_ID });
    expect(mockUpload).toHaveBeenCalledTimes(1);
    expect(mockUpload.mock.calls[0][3]).toBe("CEDULA_REVERSO");
    expect(mockExecute).toHaveBeenCalledTimes(1);
  });
});
