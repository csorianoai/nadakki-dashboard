/**
 * Pagina de Solicitudes: de donde sale la moneda y cuando se publican importes.
 *
 * #529 quito el defecto "MXN" de la vista, pero la pagina seguia pasando
 * `tenantConfig.currency_code`, que cae a "DOP". Sin medir la pagina, el defecto
 * sobrevive al arreglo de la vista con otra moneda equivocada.
 */
import { render, screen } from "@testing-library/react";

import DealerApplicationsPage from "@/app/(forge)/credit-hub/dealer/applications/page";
import { DEALER_CORE_STATUS_ROWS } from "@/lib/dealer/core-status";

const ROW = DEALER_CORE_STATUS_ROWS.find((row) => row.name === "Dealer-Bank")!;

const viewProps = jest.fn();

jest.mock("@/components/credit-hub/dealer/DealerApplicationsListView", () => ({
  DealerApplicationsListView: (props: Record<string, unknown>) => {
    viewProps(props);
    return <div data-testid="solicitudes-view" />;
  },
}));

jest.mock("@/lib/credit-hub/hooks/useCreditApplications", () => ({
  useCreditApplications: () => ({ data: [], isLoading: false, error: null, refetch: jest.fn() }),
}));

let branding: { locale?: string | null; currency?: string | null } | null = null;
jest.mock("@/lib/hooks/useTenantBranding", () => ({
  useTenantBranding: () => ({ data: branding, isPending: false, isLoading: false, error: null }),
}));

const batchMock = jest.fn();
const readinessMock = jest.fn();
jest.mock("@/lib/access/hooks", () => ({
  useAccessEntitlementsBatch: (keys: string[]) => batchMock(keys),
  useAccessReadiness: () => readinessMock(),
}));

function batch(allowed: boolean) {
  return {
    isPending: false,
    isLoading: false,
    isError: false,
    error: null,
    data: {
      results: {
        [ROW.actionCapability]: {
          allowed,
          reason_code: allowed ? "ALLOWED" : "UPGRADE_REQUIRED",
          limit: null,
          current_usage: null,
        },
      },
    },
  };
}

function readiness(status: string, usable: boolean) {
  return {
    isPending: false,
    isLoading: false,
    isError: false,
    error: null,
    data: {
      entries: [
        { capability_key: ROW.readinessKey, status, is_usable: usable, version: null, notes: null },
      ],
      summary: {},
      total: 1,
    },
  };
}

function lastProps() {
  return viewProps.mock.calls[viewProps.mock.calls.length - 1][0] as Record<string, unknown>;
}

beforeEach(() => {
  viewProps.mockReset();
  batchMock.mockReset();
  readinessMock.mockReset();
  branding = { locale: "es-AR", currency: "ARS" };
  batchMock.mockReturnValue(batch(true));
  readinessMock.mockReturnValue(readiness("AVAILABLE", true));
});

it("pasa la moneda del branding, no la del config que cae a DOP", () => {
  render(<DealerApplicationsPage />);
  expect(lastProps().currency).toBe("ARS");
});

it("sin moneda en el branding pasa null y no una por defecto", () => {
  branding = null;
  render(<DealerApplicationsPage />);
  expect(lastProps().currency).toBeNull();
});

it("sin la capability de credito no publica importes", () => {
  batchMock.mockReturnValue(batch(false));
  render(<DealerApplicationsPage />);
  expect(lastProps().currency).toBeNull();
  expect(screen.getByTestId("solicitudes-montos-ocultos")).toHaveTextContent(ROW.actionCapability);
});

it("con la certificacion pendiente dice Proximamente", () => {
  readinessMock.mockReturnValue(readiness("PENDING_EXTERNAL_ACTIVATION", false));
  render(<DealerApplicationsPage />);
  expect(screen.getByTestId("solicitudes-montos-ocultos")).toHaveTextContent("Próximamente");
  expect(lastProps().currency).toBeNull();
});

it("con acceso concedido no hay aviso", () => {
  render(<DealerApplicationsPage />);
  expect(screen.queryByTestId("solicitudes-montos-ocultos")).toBeNull();
});

/**
 * Blocker DENIAL_REASON_CODE_NOT_VISIBLE de la auditoria sobre 08ef5c6a.
 *
 * La rama de denegacion nombraba la capability que falta pero NO publicaba el
 * `reason_code`, aunque el motor lo da y este propio fichero lo fabricaba. Un
 * cierre sin motivo visible no se puede ni diagnosticar ni discutir.
 */
function batchConMotivo(reason_code: string | null) {
  return {
    isPending: false,
    isLoading: false,
    isError: false,
    error: null,
    data: {
      results: {
        [ROW.actionCapability]: { allowed: false, reason_code, limit: null, current_usage: null },
      },
    },
  };
}

it("en denegacion publica el reason_code literal que da el motor", () => {
  batchMock.mockReturnValue(batch(false));
  render(<DealerApplicationsPage />);
  const aviso = screen.getByTestId("solicitudes-montos-ocultos");
  expect(aviso).toHaveTextContent("UPGRADE_REQUIRED");
  expect(screen.getByTestId("solicitudes-reason-code")).toHaveTextContent("UPGRADE_REQUIRED");
});

it("no recapitaliza el codigo: el motor los emite en minuscula", () => {
  batchMock.mockReturnValue(batchConMotivo("upgrade_required"));
  render(<DealerApplicationsPage />);
  expect(screen.getByTestId("solicitudes-reason-code")).toHaveTextContent("upgrade_required");
  expect(screen.getByTestId("solicitudes-reason-code").textContent).toBe("upgrade_required");
});

it("sin reason_code no inventa la etiqueta", () => {
  batchMock.mockReturnValue(batchConMotivo(null));
  render(<DealerApplicationsPage />);
  expect(screen.getByTestId("solicitudes-montos-ocultos")).toHaveTextContent(ROW.actionCapability);
  expect(screen.queryByTestId("solicitudes-reason-code")).toBeNull();
  expect(screen.getByTestId("solicitudes-montos-ocultos").textContent).not.toContain("reason_code");
});
