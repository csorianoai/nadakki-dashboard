/**
 * DB-CODEX-12B parte 2: el borrador del asistente vive en el servidor.
 * (a) ningún dato personal en localStorage/sessionStorage, (b) recargar recupera desde la API,
 * (c) borrador vencido → formulario vacío con aviso. (d) logout: draft-logout-delete.test.tsx.
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
import { CreditCoreApiError, getApplicationDraft, saveApplicationDraft } from "@/lib/credit-hub/api/creditCoreClient";
import { buildWizardDraftPointerKey, readWizardDraftPointer } from "@/lib/credit-hub/dealer/wizard-draft-storage";

const APP_ID = "app-draft-0012";
const TENANT = "tenant-test-12";
const mockToastInfo = jest.fn();

const SENTINELS = {
  applicant_full_name: "CENTINELA-NOMBRE-7f3a",
  applicant_identification: "CENTINELA-CEDULA-91c2",
  applicant_phone: "CENTINELA-TEL-55d0",
  monthly_income: "CENTINELA-INGRESO-3b8e",
} as const;

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn() }),
  usePathname: () => "/credit-hub/dealer/applications/new/solicitante",
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
  useTranslations: () => ({ validation: {}, toasts: {} }),
}));
jest.mock("@/components/forge", () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
    warning: jest.fn(),
    info: (...a: unknown[]) => mockToastInfo(...a),
  },
}));
jest.mock("@/lib/credit-hub/api/operationalClient", () => ({ patchApplicationFields: jest.fn() }));
jest.mock("@/lib/credit-api", () => ({ uploadDocument: jest.fn() }));
jest.mock("@/lib/credit-hub/api/creditCoreClient", () => ({
  ...jest.requireActual("@/lib/credit-hub/api/creditCoreClient"),
  createDraftApplication: jest.fn(),
  getApplication: jest.fn().mockReturnValue(new Promise(() => undefined)),
  getApplicationDraft: jest.fn(),
  saveApplicationDraft: jest.fn().mockResolvedValue(undefined),
  deleteApplicationDraft: jest.fn().mockResolvedValue(undefined),
}));

const mockGetDraft = getApplicationDraft as jest.Mock;
const mockSaveDraft = saveApplicationDraft as jest.Mock;

let ctx: DealerWizardContextValue;
function Probe() {
  ctx = useDealerWizard();
  return null;
}

function storageDump(): string {
  const parts: string[] = [];
  for (const storage of [localStorage, sessionStorage]) {
    for (let i = 0; i < storage.length; i++) {
      const key = storage.key(i) as string;
      parts.push(key, storage.getItem(key) ?? "");
    }
  }
  return parts.join("\n");
}

async function mount() {
  await act(async () => {
    render(
      <DealerWizardProvider>
        <Probe />
      </DealerWizardProvider>,
    );
  });
}

beforeEach(() => {
  jest.clearAllMocks();
  jest.useFakeTimers();
  Object.defineProperty(globalThis, "crypto", { value: webcrypto, configurable: true });
  localStorage.clear();
  sessionStorage.clear();
  global.fetch = jest.fn().mockResolvedValue({ ok: false }) as unknown as typeof fetch;
});

afterEach(() => {
  jest.useRealTimers();
});

describe("borrador del asistente en el servidor", () => {
  test("(a) escribir y autoguardar no deja datos personales en localStorage ni sessionStorage", async () => {
    mockGetDraft.mockResolvedValue(null);
    await mount();
    await act(async () => {
      for (const [field, value] of Object.entries(SENTINELS)) {
        ctx.updateField(field as keyof typeof SENTINELS, value);
      }
    });
    await act(async () => {
      jest.advanceTimersByTime(10_000);
    });
    await act(async () => {
      ctx.saveDraftToStorage();
    });
    // el servidor sí recibió el borrador…
    expect(mockSaveDraft).toHaveBeenCalled();
    expect(JSON.stringify(mockSaveDraft.mock.calls)).toContain(SENTINELS.applicant_identification);
    // …y el navegador no guarda ninguna cadena personal.
    const dump = storageDump();
    for (const value of Object.values(SENTINELS)) expect(dump).not.toContain(value);
    expect(dump).not.toContain("CENTINELA");
  });

  test("(b) recargar recupera el borrador desde la API", async () => {
    mockGetDraft.mockResolvedValue({
      formData: { ...SENTINELS },
      expiresAt: new Date(Date.now() + 3_600_000).toISOString(),
    });
    await mount();
    expect(mockGetDraft).toHaveBeenCalledWith({ tenantId: TENANT, applicationId: APP_ID });
    expect(ctx.formData.applicant_full_name).toBe(SENTINELS.applicant_full_name);
    expect(ctx.formData.applicant_identification).toBe(SENTINELS.applicant_identification);
    expect(storageDump()).not.toContain("CENTINELA");
  });

  test("(c) borrador vencido (expires_at pasado) → formulario vacío con aviso y sin puntero", async () => {
    sessionStorage.setItem(
      buildWizardDraftPointerKey(TENANT, "user-1"),
      JSON.stringify({ tenantId: TENANT, applicationId: APP_ID }),
    );
    mockGetDraft.mockResolvedValue({
      formData: { ...SENTINELS },
      expiresAt: new Date(Date.now() - 1_000).toISOString(),
    });
    await mount();
    expect(ctx.formData.applicant_identification).toBe("");
    expect(ctx.formData.applicant_full_name).toBe("");
    expect(mockToastInfo).toHaveBeenCalledWith(expect.stringMatching(/venci/i), expect.anything());
    expect(readWizardDraftPointer(buildWizardDraftPointerKey(TENANT, "user-1"))).toBeNull();
  });

  test("(c) el servidor responde 410 → formulario vacío con aviso", async () => {
    mockGetDraft.mockRejectedValue(new CreditCoreApiError("gone", 410));
    await mount();
    expect(ctx.formData.applicant_identification).toBe("");
    expect(mockToastInfo).toHaveBeenCalledWith(expect.stringMatching(/venci/i), expect.anything());
  });
});
