import * as fs from "fs";
import * as path from "path";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { BankApplicationDetailView } from "@/components/forge/credit-hub/BankApplicationDetailView";
import { approveCompliance, isComplianceApproved } from "@/lib/credit-hub/api/bankClient";
import { useBankCounterOffer, useBankDecision } from "@/lib/credit-hub/hooks/useBankDecision";

function readSrc(relPath: string): string {
  return fs.readFileSync(path.resolve(__dirname, "../../..", relPath), "utf-8");
}

function mockJson(body: unknown, status = 200) {
  const response = {
    status,
    statusText: status >= 400 ? "Error" : "OK",
    ok: status >= 200 && status < 300,
    clone: () => ({ json: async () => body }),
    json: async () => body,
  } as Response;
  return Promise.resolve(response);
}

function installFetchMock() {
  const fn = jest.fn();
  Object.defineProperty(global, "fetch", { value: fn, writable: true, configurable: true });
  return jest.spyOn(global, "fetch");
}

jest.mock("next/font/google", () => ({
  Inter: () => ({ className: "inter", variable: "--forge-font-sans" }),
  JetBrains_Mono: () => ({ className: "jetbrains-mono", variable: "--forge-font-mono-opt" }),
  Source_Serif_4: () => ({ className: "source-serif", variable: "--forge-font-display-opt" }),
}));

jest.mock("next/link", () => ({
  __esModule: true,
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

jest.mock("@/components/credit-hub/system/PersonaProvider", () => ({
  usePersona: () => "bank",
}));

jest.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({ user: { id: "analyst-1" } }),
}));

jest.mock("@/lib/credit-hub/hooks/useTenant", () => ({
  useTenant: () => ({ tenantId: "tenant-a", tenantSlug: "tenant-a", loading: false }),
}));

jest.mock("@/lib/credit-hub/hooks/useTenantConfig", () => ({
  useTenantConfig: () => ({ tenantConfig: { locale: "es-DO" }, loading: false }),
}));

jest.mock("@/lib/credit-hub/i18n/useTranslations", () => ({
  useTranslations: () => ({
    bank_ui: {
      compliance_card_title: "Cumplimiento",
      compliance_ok: "Conforme",
      compliance_attention: "Atención",
    },
    toasts: { decision_confirmed: "Decisión confirmada" },
    bank: {},
  }),
}));

jest.mock("@/lib/credit-hub/hooks/useBankDecision", () => ({
  useBankDecision: jest.fn(),
  useBankCounterOffer: jest.fn(),
}));

jest.mock("@/lib/bank-application-detail/claim-application", () => ({
  claimBankApplication: jest.fn().mockResolvedValue({ ok: true }),
}));

jest.mock("@/components/credit-hub/dealer/analysis/CreditAnalysisPanel", () => ({
  CreditAnalysisPanel: () => <div data-testid="credit-analysis-panel" />,
}));

jest.mock("@/components/credit-hub/dealer/analysis/ScoreVisual", () => ({
  ScoreVisual: () => <div data-testid="score-visual" />,
}));

const baseApplication = {
  application_id: "test-id",
  tenant_id: "tenant-a",
  state: "pending",
  application_payload: {
    applicant: { full_name: "Test User" },
    financial: { requested_amount: 500000 },
    vehicle: { make: "Toyota", model: "Corolla" },
    analysis: {
      score: 720,
      financed_amount: 500000,
      approval_band: "A",
      risk_level: "BAJO",
      confidence: 0.85,
      engine: "test_engine",
      explanation: "Análisis de prueba",
      metrics: {
        annual_rate: 18,
        term_months: 36,
        down_payment: 100000,
        dti: 0.3,
        payment_capacity: 50000,
        estimated_payment: 15000,
        financed_amount: 500000,
      },
    },
  },
};

describe("bankClient — compliance approval (Sub-K2)", () => {
  beforeEach(() => {
    jest.restoreAllMocks();
    window.localStorage.clear();
  });

  test("isComplianceApproved returns true when payload stamped approved", () => {
    expect(
      isComplianceApproved({
        application_payload: { compliance_approval: { status: "approved" } },
      } as never)
    ).toBe(true);
  });

  test("isComplianceApproved returns false when missing or not approved", () => {
    expect(isComplianceApproved({ application_payload: {} } as never)).toBe(false);
    expect(
      isComplianceApproved({
        application_payload: { compliance_approval: { status: "pending" } },
      } as never)
    ).toBe(false);
  });

  test("approveCompliance posts to compliance/approve with chFetch headers", async () => {
    const fetchSpy = installFetchMock().mockResolvedValue(
      await mockJson({
        compliance: { status: "approved", approved_at: "2026-06-06T00:00:00Z", approved_by: "officer-1" },
      })
    );
    const result = await approveCompliance({ tenantId: "tenant-a", applicationId: "app-1" });
    expect(result.ok).toBe(true);
    expect(fetchSpy.mock.calls[0][0]).toBe("/api/v2/credit/applications/app-1/compliance/approve");
    expect(fetchSpy.mock.calls[0][1]?.method).toBe("POST");
    const headers = fetchSpy.mock.calls[0][1]?.headers as Record<string, string>;
    expect(headers["X-Tenant-ID"]).toBe("tenant-a");
    expect(headers["X-Actor-Role"]).toBe("compliance_officer");
    expect(JSON.parse(String(fetchSpy.mock.calls[0][1]?.body))).toEqual({
      notes: "Compliance verified - Ley 172-13",
    });
  });

  test("approveCompliance returns error payload on failure", async () => {
    installFetchMock().mockResolvedValue(await mockJson({ detail: "forbidden" }, 403));
    const result = await approveCompliance({ tenantId: "tenant-a", applicationId: "app-1" });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toBeTruthy();
  });
});

describe("BankApplicationDetailView — compliance approval UI (Sub-K2)", () => {
  beforeEach(() => {
    (useBankDecision as jest.Mock).mockReturnValue({ mutateAsync: jest.fn(), isPending: false });
    (useBankCounterOffer as jest.Mock).mockReturnValue({ data: undefined });
  });

  test("shows compliance card when not approved", () => {
    render(<BankApplicationDetailView application={baseApplication as never} />);
    expect(screen.getByText(/Cumplimiento Pendiente/i)).toBeInTheDocument();
  });

  test("hides compliance card when already approved", () => {
    const app = {
      ...baseApplication,
      application_payload: {
        ...baseApplication.application_payload,
        compliance_approval: { status: "approved" },
      },
    };
    render(<BankApplicationDetailView application={app as never} />);
    expect(screen.queryByText(/Cumplimiento Pendiente/i)).not.toBeInTheDocument();
    expect(screen.getByText(/Cumplimiento aprobado/i)).toBeInTheDocument();
  });

  test("disables Aprobar button until compliance approved", () => {
    render(<BankApplicationDetailView application={baseApplication as never} />);
    expect(screen.getByRole("button", { name: "Aprobar" })).toBeDisabled();
  });

  test("enables Aprobar button when compliance already approved", () => {
    const app = {
      ...baseApplication,
      application_payload: {
        ...baseApplication.application_payload,
        compliance_approval: { status: "approved" },
      },
    };
    render(<BankApplicationDetailView application={app as never} />);
    expect(screen.getByRole("button", { name: "Aprobar" })).not.toBeDisabled();
  });

  test("calls compliance approve endpoint on button click", async () => {
    const fetchSpy = installFetchMock().mockResolvedValue(
      await mockJson({
        compliance: { status: "approved", approved_at: "2026-06-06T00:00:00Z", approved_by: "officer-1" },
      })
    );
    render(<BankApplicationDetailView application={baseApplication as never} />);
    fireEvent.click(screen.getByRole("button", { name: /Aprobar Cumplimiento/i }));
    await waitFor(() => {
      expect(fetchSpy).toHaveBeenCalledWith(
        "/api/v2/credit/applications/test-id/compliance/approve",
        expect.objectContaining({ method: "POST" })
      );
    });
    await waitFor(() => {
      expect(screen.getByText(/Cumplimiento aprobado/i)).toBeInTheDocument();
    });
    expect(screen.getByRole("button", { name: "Aprobar" })).not.toBeDisabled();
  });
});

describe("BankApplicationDetailView source — compliance gating (Sub-K2)", () => {
  const src = readSrc("components/forge/credit-hub/BankApplicationDetailView.tsx");

  test("imports approveCompliance and isComplianceApproved", () => {
    expect(src).toContain('import { approveCompliance, isComplianceApproved } from "@/lib/credit-hub/api/bankClient"');
  });

  test("gates Aprobar button with complianceApproved", () => {
    expect(src).toContain("disabled={!complianceApproved}");
    expect(src).toContain('title={!complianceApproved ? "Debe aprobar cumplimiento primero" : undefined}');
  });

  test("renders compliance pending card copy", () => {
    expect(src).toContain("Cumplimiento Pendiente (Ley 172-13)");
    expect(src).toContain("Aprobar Cumplimiento");
  });
});
