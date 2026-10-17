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
import { CreditCoreApiError, createDraftApplication, getApplication, getApplicationDraft, saveApplicationDraft } from "@/lib/credit-hub/api/creditCoreClient";
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

const mockReplace = jest.fn();
const mockRouter = { push: jest.fn(), replace: mockReplace };
let mockQuery = `application_id=${APP_ID}`;
jest.mock("next/navigation", () => ({
  useRouter: () => mockRouter,
  usePathname: () => "/credit-hub/dealer/applications/new/solicitante",
  useSearchParams: () => new URLSearchParams(mockQuery),
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

const storageDump = () => [localStorage, sessionStorage].map((st) => Object.keys(st).concat(Object.values(st)).join("\n")).join("\n");

async function mount() {
  let view!: ReturnType<typeof render>;
  await act(async () => {
    view = render(<DealerWizardProvider><Probe /></DealerWizardProvider>);
  });
  return view;
}

beforeEach(() => {
  jest.clearAllMocks();
  mockQuery = `application_id=${APP_ID}`;
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
  test("(c) 404 del borrador tras hidratar la solicitud → se conservan los datos hidratados, sin aviso", async () => {
    sessionStorage.setItem(
      buildWizardDraftPointerKey(TENANT, "user-1"),
      JSON.stringify({ tenantId: TENANT, applicationId: APP_ID }),
    );
    let rejectDraft: (e: unknown) => void = () => undefined;
    mockGetDraft.mockReturnValue(new Promise((_, reject) => { rejectDraft = reject; }));
    (getApplication as jest.Mock).mockResolvedValueOnce({
      raw: { application_payload: { applicant: { full_name: "Nombre Hidratado Ficticio" } } },
    });
    await mount();
    expect(ctx.formData.applicant_full_name).toBe("Nombre Hidratado Ficticio");
    await act(async () => {
      rejectDraft(new CreditCoreApiError("not found", 404));
    });
    expect(ctx.formData.applicant_full_name).toBe("Nombre Hidratado Ficticio");
    expect(mockToastInfo).not.toHaveBeenCalled();
  });
  test("guardar y salir sin solicitud: si el provider se desmonta, la creación no navega de vuelta", async () => {
    mockQuery = "";
    mockGetDraft.mockResolvedValue(null);
    let resolveCreate: (v: { application_id: string }) => void = () => undefined;
    (createDraftApplication as jest.Mock).mockReturnValue(new Promise((res) => { resolveCreate = res; }));
    const view = await mount();
    await act(async () => { ctx.saveDraftToStorage(); });
    view.unmount();
    await act(async () => { resolveCreate({ application_id: "app-new-1" }); });
    expect(mockReplace).not.toHaveBeenCalled();
  });
});
