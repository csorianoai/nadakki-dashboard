import { act, renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { DealerWizardProvider, useDealerWizard } from "@/components/forge/credit-hub/dealer/DealerWizardProvider";
import { executeMultiLender } from "@/lib/credit-hub/api/creditCoreClient";

let mockApplicationId = "app-1";

jest.mock("next/navigation", () => ({
  usePathname: () => "/autos/dealer/credito/solicitudes/nueva/revision",
  useRouter: () => ({ push: jest.fn(), replace: jest.fn() }),
  useSearchParams: () => new URLSearchParams(`application_id=${mockApplicationId}`),
}));
jest.mock("@/hooks/useAuth", () => ({ useAuth: () => ({ user: { id: "user-1" } }) }));
jest.mock("@/lib/credit-hub/hooks/useTenant", () => ({ useTenant: () => ({ tenantId: "tenant-1" }) }));
jest.mock("@/lib/credit-hub/hooks/useTenantConfig", () => ({
  useTenantConfig: () => ({
    tenantConfig: { country_code: "DO", locale: "es-DO", document_types: { primary_id: "CEDULA" }, features_enabled: {} },
  }),
}));
jest.mock("@/lib/credit-hub/i18n/useTranslations", () => ({
  useTranslations: () => ({ toasts: { application_failed: "Falló" }, validation: { consents_required: "Consentimientos" } }),
}));
jest.mock("@/components/forge", () => ({ toast: { error: jest.fn(), success: jest.fn() } }));
jest.mock("@/lib/credit-api", () => ({ uploadDocument: jest.fn() }));
jest.mock("@/lib/credit-hub/api/operationalClient", () => ({ patchApplicationFields: jest.fn().mockResolvedValue({}) }));
jest.mock("@/lib/credit-hub/dealer/wizard-gates", () => ({
  ...jest.requireActual("@/lib/credit-hub/dealer/wizard-gates"),
  wizardDocumentsStepValid: () => true,
}));
jest.mock("@/components/credit-hub/dealer/wizard/WizardContainer", () => ({
  ...jest.requireActual("@/components/credit-hub/dealer/wizard/WizardContainer"),
  stepIsValid: () => true,
}));
jest.mock("@/lib/credit-hub/api/creditCoreClient", () => ({
  ...jest.requireActual("@/lib/credit-hub/api/creditCoreClient"),
  createDraftApplication: jest.fn(),
  getApplication: jest.fn().mockResolvedValue({ raw: {} }),
  getDocumentCompleteness: jest.fn().mockResolvedValue({ complete: true, missing: [] }),
  saveApplicantApplication: jest.fn().mockResolvedValue({}),
  saveVehicleApplication: jest.fn().mockResolvedValue({}),
  executeMultiLender: jest.fn(),
}));

const execute = executeMultiLender as jest.Mock;
const wrapper = ({ children }: { children: ReactNode }) => <DealerWizardProvider>{children}</DealerWizardProvider>;

function keyOfCall(index: number): string {
  return execute.mock.calls[index][0].idempotencyKey;
}

async function submit(result: { current: ReturnType<typeof useDealerWizard> }) {
  let outcome: "ok" | "error" = "ok";
  await act(async () => {
    await result.current.submitApplication().catch(() => {
      outcome = "error";
    });
  });
  return outcome;
}

describe("DealerWizardProvider submitApplication idempotency", () => {
  beforeAll(() => {
    // jsdom has no SubtleCrypto; the consent-audit hash needs it.
    Object.defineProperty(globalThis, "crypto", { value: require("node:crypto").webcrypto, configurable: true });
  });

  beforeEach(() => {
    sessionStorage.clear();
    localStorage.clear();
    execute.mockReset();
    mockApplicationId = "app-1";
    global.fetch = jest.fn().mockResolvedValue({ ok: false, json: async () => ({}) }) as unknown as typeof fetch;
  });

  test("a failed run is not success and the retry reuses the same key", async () => {
    execute.mockResolvedValueOnce({ status: "failed" }).mockResolvedValueOnce({ status: "completed" });
    const { result } = renderHook(() => useDealerWizard(), { wrapper });

    expect(await submit(result)).toBe("error");
    expect(await submit(result)).toBe("ok");

    expect(execute).toHaveBeenCalledTimes(2);
    expect(keyOfCall(1)).toBe(keyOfCall(0));
  });

  test("different drafts send different keys", async () => {
    execute.mockResolvedValue({ status: "failed" });
    const first = renderHook(() => useDealerWizard(), { wrapper });
    await submit(first.result);
    mockApplicationId = "app-2";
    const second = renderHook(() => useDealerWizard(), { wrapper });
    await submit(second.result);

    expect(keyOfCall(1)).not.toBe(keyOfCall(0));
  });

  test("after a success the same slot gets a new key", async () => {
    execute.mockResolvedValue({ status: "completed" });
    const first = renderHook(() => useDealerWizard(), { wrapper });
    expect(await submit(first.result)).toBe("ok");
    expect(sessionStorage.length).toBe(0);
    const second = renderHook(() => useDealerWizard(), { wrapper });
    expect(await submit(second.result)).toBe("ok");

    expect(keyOfCall(1)).not.toBe(keyOfCall(0));
  });

  test("a double click does not fire two requests", async () => {
    let release: (value: { status: string }) => void = () => undefined;
    execute.mockReturnValue(new Promise((resolve) => (release = resolve)));
    const { result } = renderHook(() => useDealerWizard(), { wrapper });

    let second: "ok" | "error" = "ok";
    await act(async () => {
      const firstClick = result.current.submitApplication();
      await result.current.submitApplication().catch(() => {
        second = "error";
      });
      await new Promise((r) => setTimeout(r, 0));
      release({ status: "completed" });
      await firstClick;
    });

    expect(second).toBe("error");
    expect(execute).toHaveBeenCalledTimes(1);
  });
});
