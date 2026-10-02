/**
 * Cockpit de Dealer-Bank: de donde sale la moneda y cuando se publican importes.
 *
 * Se renderiza la PAGINA. El packet anterior (#527) quito el "RD$" escrito a
 * mano del formateador, pero la pantalla seguia pasando
 * `tenantConfig.currency_code`, que cae a "DOP". Sin medir la pagina, el defecto
 * sobrevive al arreglo del formateador.
 *
 * `DealerDashboardView` se mockea: lo que se mide aqui es QUE moneda y QUE
 * decision de acceso recibe, no como las pinta.
 */
import { render, screen } from "@testing-library/react";

import DealerDashboardPage from "@/app/(forge)/credit-hub/dealer/page";
import { DEALER_CORE_STATUS_ROWS } from "@/lib/dealer/core-status";
import { ACCESS_UNVERIFIED_MESSAGE } from "@/lib/access/reason-codes";

const ROW = DEALER_CORE_STATUS_ROWS.find((row) => row.name === "Dealer-Bank")!;

const viewProps = jest.fn();

jest.mock("@/components/credit-hub/dealer/DealerDashboardView", () => ({
  DealerDashboardView: (props: Record<string, unknown>) => {
    viewProps(props);
    return <div data-testid="dealer-dashboard-view" />;
  },
}));

jest.mock("@/components/credit-hub/onboarding/WelcomeGuide", () => ({
  WelcomeGuide: () => null,
}));

jest.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({ tenantName: "Mapaal" }),
}));

jest.mock("@/lib/credit-hub/hooks/useTenantConfig", () => ({
  useTenantConfig: () => ({
    tenantConfig: { institution_name: "Mapaal", currency_code: "DOP", locale: "es-DO" },
  }),
}));

jest.mock("@/lib/credit-hub/hooks/useCreditApplications", () => ({
  useCreditApplications: () => ({ data: [], isLoading: false, error: null, refetch: jest.fn() }),
}));

jest.mock("@/lib/credit-hub/hooks/useCreditStats", () => ({
  useCreditStats: () => ({ data: undefined, isLoading: false, error: null, refetch: jest.fn() }),
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

function batch(allowed: boolean, reason?: string) {
  return {
    isPending: false,
    isLoading: false,
    isError: false,
    error: null,
    data: {
      results: {
        [ROW.actionCapability]: {
          allowed,
          reason_code: reason ?? (allowed ? "ALLOWED" : "UPGRADE_REQUIRED"),
          limit: null,
          current_usage: null,
        },
      },
    },
  };
}

function readinessReady(status: string, usable: boolean) {
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
  readinessMock.mockReturnValue(readinessReady("AVAILABLE", true));
});

describe("moneda", () => {
  it("toma la del branding del tenant y no la del config, que cae a DOP", () => {
    render(<DealerDashboardPage />);
    expect(lastProps().currency).toBe("ARS");
    expect(lastProps().locale).toBe("es-AR");
  });

  it("sin moneda en el branding pasa null en vez de caer a DOP", () => {
    branding = { locale: "es-AR", currency: null };
    render(<DealerDashboardPage />);
    expect(lastProps().currency).toBeNull();
  });

  it("sin branding tampoco inventa moneda", () => {
    branding = null;
    render(<DealerDashboardPage />);
    expect(lastProps().currency).toBeNull();
  });
});

describe("cuando se publican importes", () => {
  it("pide al batch solo claves del catalogo 097 de la fila de Dealer-Bank", () => {
    render(<DealerDashboardPage />);
    expect(batchMock).toHaveBeenCalledWith([ROW.readinessKey, ROW.actionCapability]);
  });

  it("con capability y readiness operable se publican", () => {
    render(<DealerDashboardPage />);
    expect(screen.queryByTestId("dealer-bank-montos-ocultos")).toBeNull();
    expect(lastProps().currency).toBe("ARS");
  });

  it("sin la capability de credito no hay importes y se dice cual falta", () => {
    batchMock.mockReturnValue(batch(false, "UPGRADE_REQUIRED"));
    render(<DealerDashboardPage />);
    const aviso = screen.getByTestId("dealer-bank-montos-ocultos");
    expect(aviso).toHaveTextContent(ROW.actionCapability);
    expect(lastProps().currency).toBeNull();
  });

  it("con la certificacion pendiente dice Proximamente, no un error tecnico", () => {
    readinessMock.mockReturnValue(readinessReady("PENDING_EXTERNAL_ACTIVATION", false));
    render(<DealerDashboardPage />);
    const aviso = screen.getByTestId("dealer-bank-montos-ocultos");
    expect(aviso).toHaveTextContent("Próximamente");
    expect(aviso).toHaveAttribute("data-core-state", "NOT_READY");
    expect(lastProps().currency).toBeNull();
  });

  it("mientras readiness carga no se publica nada", () => {
    readinessMock.mockReturnValue({ isPending: true, isLoading: true, isError: false, error: null, data: undefined });
    render(<DealerDashboardPage />);
    expect(screen.getByTestId("dealer-bank-montos-ocultos")).toHaveTextContent("Verificando");
    expect(lastProps().currency).toBeNull();
  });

  it("si readiness falla cierra en vez de publicar", () => {
    readinessMock.mockReturnValue({
      isPending: false,
      isLoading: false,
      isError: true,
      error: new Error("red caida"),
      data: undefined,
    });
    render(<DealerDashboardPage />);
    expect(screen.getByTestId("dealer-bank-montos-ocultos")).toBeInTheDocument();
    expect(lastProps().currency).toBeNull();
  });
});

/**
 * "No pude evaluarte" no es "no tienes derecho" (#550).
 *
 * Con `no_organization_unit` o `no_beneficiary_entitlement` el motor no dice que
 * falte la capability: dice que no llego a comprobarlo --sin
 * `organization_unit_id` la cadena BENEFICIARY deniega cerrado antes de consultar
 * nada, services/access/entitlements.py:330-339--. Los codigos llegan en
 * MINUSCULAS dentro de un 200, no como error HTTP.
 */
describe("acceso que no se pudo verificar", () => {
  for (const codigo of ["no_organization_unit", "no_beneficiary_entitlement"]) {
    it(`con ${codigo} dice que no se pudieron verificar los accesos`, () => {
      batchMock.mockReturnValue(batch(false, codigo));
      render(<DealerDashboardPage />);
      const aviso = screen.getByTestId("dealer-bank-montos-ocultos");
      expect(aviso).toHaveAttribute("data-no-verificado", "true");
      expect(aviso).toHaveTextContent(ACCESS_UNVERIFIED_MESSAGE);
      expect(aviso.textContent).not.toContain("reservados a quien tenga la capability");
      expect(aviso).toHaveTextContent(codigo);
    });
  }

  it("no distingue la caja del codigo: el motor los emite en minuscula", () => {
    batchMock.mockReturnValue(batch(false, "NO_BENEFICIARY_ENTITLEMENT"));
    render(<DealerDashboardPage />);
    expect(screen.getByTestId("dealer-bank-montos-ocultos")).toHaveTextContent(
      ACCESS_UNVERIFIED_MESSAGE,
    );
  });

  it("gana sobre el Proximamente de readiness: si no se evaluo, no se afirma que falte certificacion", () => {
    readinessMock.mockReturnValue(readinessReady("PENDING_EXTERNAL_ACTIVATION", false));
    batchMock.mockReturnValue(batch(false, "no_organization_unit"));
    render(<DealerDashboardPage />);
    const aviso = screen.getByTestId("dealer-bank-montos-ocultos");
    expect(aviso).toHaveTextContent(ACCESS_UNVERIFIED_MESSAGE);
    expect(aviso.textContent).not.toContain("Próximamente");
  });

  it("una denegacion normal sigue nombrando la capability que falta", () => {
    batchMock.mockReturnValue(batch(false, "UPGRADE_REQUIRED"));
    render(<DealerDashboardPage />);
    const aviso = screen.getByTestId("dealer-bank-montos-ocultos");
    expect(aviso).toHaveAttribute("data-no-verificado", "false");
    expect(aviso).toHaveTextContent(ROW.actionCapability);
    expect(aviso.textContent).not.toContain(ACCESS_UNVERIFIED_MESSAGE);
  });

  it("en ninguno de los dos casos se publican importes", () => {
    for (const codigo of ["no_organization_unit", "UPGRADE_REQUIRED"]) {
      batchMock.mockReturnValue(batch(false, codigo));
      const { unmount } = render(<DealerDashboardPage />);
      expect(screen.getByTestId("dealer-bank-montos-ocultos")).toBeInTheDocument();
      unmount();
    }
  });
});
