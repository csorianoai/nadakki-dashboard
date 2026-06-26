/** @jest-environment jsdom */

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { HearingsDashboard } from "@/components/legal/hearings/HearingsDashboard";
import { HearingsApiError } from "@/lib/legal/hearings/hearings-api";
import type { HearingOut } from "@/lib/legal/hearings/hearings-types";

jest.mock("@/hooks/useLegalCore", () => ({
  useLegalEffectiveTenantId: () => ({
    effectiveTenantId: "tenant-test",
    tenantHydrated: true,
    tenantError: null,
  }),
}));

const mockUseAuth = jest.fn();
jest.mock("@/hooks/useAuth", () => ({ useAuth: () => mockUseAuth() }));

const mockConfig = jest.fn();
const mockKpis = jest.fn();
const mockList = jest.fn();
const createMutate = jest.fn();
const patchMutate = jest.fn();
jest.mock("@/hooks/legal/useHearings", () => ({
  useHearingConfig: () => mockConfig(),
  useHearingKpis: () => mockKpis(),
  useHearingsList: () => mockList(),
  useCreateHearing: () => ({ mutateAsync: createMutate, isPending: false }),
  usePatchHearingStatus: () => ({ mutateAsync: patchMutate, isPending: false }),
}));

const toastError = jest.fn();
const toastSuccess = jest.fn();
jest.mock("@/components/forge/ui/Toast", () => ({
  toast: { error: (...a: unknown[]) => toastError(...a), success: (...a: unknown[]) => toastSuccess(...a) },
}));

function fakeHearing(overrides: Partial<HearingOut> = {}): HearingOut {
  return {
    id: "h-1",
    tenant_id: "tenant-test",
    case_id: "case-9",
    external_ref: null,
    title: "Audiencia preliminar Pérez",
    description: null,
    hearing_type: "AUDIENCIA_PRELIMINAR",
    status: "SCHEDULED",
    hearing_date: "2026-07-01T14:00:00Z",
    duration_minutes: 60,
    location: "Santo Domingo",
    courtroom: "Sala 3",
    judge_name: "Juez X",
    jurisdiction: "DO",
    timezone: "America/Santo_Domingo",
    assigned_to_user_id: null,
    notes: null,
    created_by: "u",
    updated_by: null,
    created_at: "2026-06-01T00:00:00Z",
    updated_at: "2026-06-01T00:00:00Z",
    ...overrides,
  };
}

const CONFIG = {
  data: {
    statuses: ["SCHEDULED", "CONFIRMED"],
    hearing_types: ["AUDIENCIA_FONDO", "AUDIENCIA_PRELIMINAR"],
    default_timezone: "America/Santo_Domingo",
    transitions: {},
  },
  isLoading: false,
  error: null,
};

const KPIS = {
  data: {
    upcoming_7d: 2,
    overdue: 1,
    completed_30d: 3,
    cancelled_30d: 0,
    by_status: {},
    by_type: {},
    next_hearing: null,
    demo_data: false,
  },
  isLoading: false,
  isError: false,
  error: null,
  refetch: jest.fn(),
};

const LIST = {
  data: { hearings: [fakeHearing()], total: 1 },
  isLoading: false,
  isError: false,
  error: null,
  refetch: jest.fn(),
};

beforeEach(() => {
  jest.clearAllMocks();
  mockUseAuth.mockReturnValue({ allRoles: [{ role_key: "legal_admin", core_name: "legal", display_name: "Legal Admin" }] });
  mockConfig.mockReturnValue(CONFIG);
  mockKpis.mockReturnValue(KPIS);
  mockList.mockReturnValue(LIST);
  createMutate.mockResolvedValue(fakeHearing());
});

describe("HearingsDashboard", () => {
  it("renders header, real KPI fields and the hearings list", () => {
    render(<HearingsDashboard />);
    expect(screen.getByRole("heading", { name: /calendario de audiencias/i })).toBeInTheDocument();
    expect(screen.getByText(/Próximas \(7 días\)/i)).toBeInTheDocument();
    expect(screen.getByText(/Vencidas/i)).toBeInTheDocument();
    expect(screen.getByText("Audiencia preliminar Pérez")).toBeInTheDocument();
  });

  it("shows a loading skeleton while the list is loading", () => {
    mockList.mockReturnValue({ ...LIST, isLoading: true, data: undefined });
    const { container } = render(<HearingsDashboard />);
    expect(container.querySelector(".animate-pulse")).toBeTruthy();
  });

  it("uses statuses and hearing_types from /config in the filters", () => {
    render(<HearingsDashboard />);
    // "Scheduled"/"Confirmed" also appear in per-card status controls → use getAll.
    expect(screen.getAllByRole("option", { name: "Scheduled" }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole("option", { name: "Confirmed" }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole("option", { name: "Audiencia Fondo" }).length).toBeGreaterThan(0);
  });

  it("shows an honest demo_data badge when KPIs report demo data", () => {
    mockKpis.mockReturnValue({ ...KPIS, data: { ...KPIS.data, demo_data: true } });
    render(<HearingsDashboard />);
    expect(screen.getByText(/Datos de demostración/i)).toBeInTheDocument();
  });

  it("renders the empty state with zero hearings", () => {
    mockList.mockReturnValue({ ...LIST, data: { hearings: [], total: 0 } });
    render(<HearingsDashboard />);
    expect(screen.getByText(/No hay audiencias para este rango/i)).toBeInTheDocument();
  });

  it("opens the create dialog and validates required title + hearing_date", async () => {
    const user = userEvent.setup();
    render(<HearingsDashboard />);
    await user.click(screen.getByRole("button", { name: /nueva audiencia/i }));
    const dialog = screen.getByRole("dialog");
    expect(dialog).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /crear audiencia/i }));
    expect(toastError).toHaveBeenCalledWith(expect.stringMatching(/título/i));
    expect(createMutate).not.toHaveBeenCalled();

    await user.type(screen.getByLabelText(/título/i), "Mi audiencia");
    await user.click(screen.getByRole("button", { name: /crear audiencia/i }));
    expect(toastError).toHaveBeenCalledWith(expect.stringMatching(/fecha/i));
    expect(createMutate).not.toHaveBeenCalled();
  });

  it("submits create WITHOUT tenant_id in the payload and shows success", async () => {
    const user = userEvent.setup();
    render(<HearingsDashboard />);
    await user.click(screen.getByRole("button", { name: /nueva audiencia/i }));
    await user.type(screen.getByLabelText(/título/i), "Mi audiencia");
    await user.type(screen.getByLabelText(/fecha y hora/i), "2026-07-02T10:30");
    await user.click(screen.getByRole("button", { name: /crear audiencia/i }));

    expect(createMutate).toHaveBeenCalledTimes(1);
    const payload = createMutate.mock.calls[0][0];
    expect(payload).not.toHaveProperty("tenant_id");
    expect(payload.title).toBe("Mi audiencia");
    expect(typeof payload.hearing_date).toBe("string");
    expect(toastSuccess).toHaveBeenCalled();
  });

  it("hides write controls when no authorizing role is present", () => {
    mockUseAuth.mockReturnValue({ allRoles: [{ role_key: "marketer", core_name: "marketing", display_name: "M" }] });
    render(<HearingsDashboard />);
    expect(screen.queryByRole("button", { name: /nueva audiencia/i })).toBeNull();
  });

  it("shows a clear permission panel on 403", () => {
    mockList.mockReturnValue({
      ...LIST,
      isError: true,
      error: new HearingsApiError("No tienes permiso para gestionar audiencias.", 403),
    });
    render(<HearingsDashboard />);
    expect(screen.getByText(/Sin permiso/i)).toBeInTheDocument();
  });

  it("does not leak tokens/secrets into the rendered output", () => {
    const { container } = render(<HearingsDashboard />);
    expect(container.textContent ?? "").not.toMatch(/bearer|password|secret|authorization/i);
  });
});
