/**
 * El menu del dealer dice por que esta vacio.
 *
 * Es el menu que Mapaal usa a diario, y hoy sus permisos fallan con
 * `no_organization_unit`: el backend no recibe la unidad organizativa y el motor
 * deniega CERRADO antes de consultar nada
 * (services/access/entitlements.py:330-339). Con `failClosed`, `allows` devuelve
 * false para todo, `groups` queda en [] y el sidebar pintaba un `<nav>` vacio:
 * indistinguible de "tu plan no incluye ningun modulo".
 *
 * Se renderiza el LAYOUT del dealer, igual que DealerShell.test.tsx, porque lo
 * que se entrega es la conducta montada: un aviso correcto que nadie monta no se
 * lo lee nadie.
 *
 * El codigo llega POR CAPABILITY dentro de un 200, asi que los casos siembran
 * items denegados, no un error HTTP. Hay uno aparte para el 403.
 */
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";

import DealerLayout from "@/app/autos/dealer/layout";
import { DEALER_NAV_CAPABILITY_KEYS } from "@/components/dealer-management/shell/dealer-nav";
import { ACCESS_UNVERIFIED_MESSAGE } from "@/lib/access/reason-codes";
import { AccessApiError } from "@/lib/access/client";

jest.mock("@/lib/auth/token-refresh", () => ({
  refreshAccessToken: jest.fn(async () => false),
  isTokenExpiringSoon: jest.fn(() => false),
}));

jest.mock("next/navigation", () => ({
  usePathname: () => "/autos/dealer",
  useRouter: () => ({ push: jest.fn(), replace: jest.fn() }),
}));

jest.mock("@/lib/dealer-management/useDealerManagementBranding", () => ({
  useDealerManagementBranding: () => ({ data: undefined, isPending: false, isLoading: false }),
}));

const batchMock = jest.fn();
jest.mock("@/lib/access/hooks", () => ({
  useAccessEntitlementsBatch: (keys: string[]) => batchMock(keys),
}));

/** Batch 200 cuyos items vienen denegados con el codigo que se quiera probar. */
function batchDenegado(reasonCode: string) {
  return {
    isError: false,
    error: null,
    isPending: false,
    isLoading: false,
    data: {
      scope: "tenant",
      unitScope: "omitted",
      results: Object.fromEntries(
        DEALER_NAV_CAPABILITY_KEYS.map((key) => [
          key,
          { allowed: false, reason_code: reasonCode, limit: null, current_usage: null },
        ]),
      ),
    },
  };
}

function batchConcedido() {
  return {
    isError: false,
    error: null,
    isPending: false,
    isLoading: false,
    data: {
      scope: "tenant",
      unitScope: "included",
      results: Object.fromEntries(
        DEALER_NAV_CAPABILITY_KEYS.map((key) => [
          key,
          { allowed: true, reason_code: "ALLOWED", limit: null, current_usage: null },
        ]),
      ),
    },
  };
}

function batch403() {
  return {
    isError: true,
    error: new AccessApiError({
      status: 403,
      reason_code: "no_organization_unit",
      detail: null,
      endpoint: "/api/v1/access/entitlements/batch",
    }),
    isPending: false,
    isLoading: false,
    data: undefined,
  };
}

/**
 * El `QueryClientProvider` es del REBASE, no de este PR.
 *
 * Cuando se escribio este fichero `DealerShell` no usaba react-query. Al rebasar
 * sobre staging, el shell ya trae el sync del contexto del dealer
 * (`useQuery(["dealer-context-sync"])`, DealerShell.tsx:85, que entro con #553),
 * y sin provider los 12 casos morian con "No QueryClient set" antes de llegar a
 * su asercion. Mismo envoltorio que `DealerShell.test.tsx`, que es el vecino ya
 * mergeado. No cambia ninguna asercion ni una linea de produccion.
 */
function montar() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <DealerLayout>
        <p>contenido del panel</p>
      </DealerLayout>
    </QueryClientProvider>,
  );
}

beforeEach(() => batchMock.mockReset());

describe("cuando el acceso no se pudo verificar", () => {
  it("con no_organization_unit lo dice, en vez de dejar el menu mudo", () => {
    batchMock.mockReturnValue(batchDenegado("no_organization_unit"));
    montar();
    const aviso = screen.getByTestId("dealer-acceso-no-verificado");
    expect(aviso).toHaveTextContent(ACCESS_UNVERIFIED_MESSAGE);
    expect(aviso.getAttribute("role")).toBe("alert");
  });

  it("explica que el menu vacio no significa que falten modulos", () => {
    batchMock.mockReturnValue(batchDenegado("no_organization_unit"));
    montar();
    expect(screen.getByTestId("dealer-acceso-no-verificado")).toHaveTextContent(
      /no porque no tengas módulos/i,
    );
  });

  it("deja ver el codigo para que soporte sepa que mirar", () => {
    batchMock.mockReturnValue(batchDenegado("no_organization_unit"));
    montar();
    expect(screen.getByTestId("dealer-acceso-no-verificado")).toHaveAttribute(
      "data-reason-code",
      "no_organization_unit",
    );
  });

  it("vale igual con el codigo en mayusculas", () => {
    batchMock.mockReturnValue(batchDenegado("NO_ORGANIZATION_UNIT"));
    montar();
    expect(screen.getByTestId("dealer-acceso-no-verificado")).toBeInTheDocument();
  });

  it("y con no_beneficiary_entitlement", () => {
    batchMock.mockReturnValue(batchDenegado("no_beneficiary_entitlement"));
    montar();
    expect(screen.getByTestId("dealer-acceso-no-verificado")).toBeInTheDocument();
  });

  it("tambien cuando llega como 403, no solo como item denegado", () => {
    batchMock.mockReturnValue(batch403());
    montar();
    expect(screen.getByTestId("dealer-acceso-no-verificado")).toBeInTheDocument();
  });

  /**
   * El aviso NO puede ser una puerta. Con el batch en error, `isAccessQueryFailClosed`
   * entra y `allows` tiene que seguir devolviendo false: si alguien convirtiera esa
   * rama en fail-open para "ser amable mientras falla el acceso", el menu
   * apareceria entero sin que nadie lo hubiera concedido. Este caso es el que lo
   * impide.
   */
  it("con el batch en error el menu sigue cerrado: el aviso no concede nada", () => {
    batchMock.mockReturnValue(batch403());
    montar();
    expect(screen.getByTestId("dealer-acceso-no-verificado")).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /Inventario/ })).toBeNull();
    expect(screen.queryByRole("link", { name: /Contabilidad/ })).toBeNull();
    expect(screen.queryByRole("link", { name: /Dealer-Bank/ })).toBeNull();
  });

  it("mientras el batch carga tampoco hay menu ni aviso prematuro", () => {
    batchMock.mockReturnValue({
      isError: false,
      error: null,
      isPending: true,
      isLoading: true,
      data: undefined,
    });
    montar();
    expect(screen.queryByRole("link", { name: /Inventario/ })).toBeNull();
    expect(screen.queryByTestId("dealer-acceso-no-verificado")).toBeNull();
  });

  it("el aviso no se come el contenido de la pantalla", () => {
    batchMock.mockReturnValue(batchDenegado("no_organization_unit"));
    montar();
    expect(screen.getByText("contenido del panel")).toBeInTheDocument();
  });

  it("sigue sin pintar items del menu: el aviso no concede nada", () => {
    batchMock.mockReturnValue(batchDenegado("no_organization_unit"));
    montar();
    expect(screen.queryByRole("link", { name: /Inventario/ })).toBeNull();
    expect(screen.queryByRole("link", { name: /Finanzas por vehículo/ })).toBeNull();
  });
});

describe("cuando el acceso si se verifico", () => {
  it("una denegacion por plan no pinta el aviso de verificacion", () => {
    batchMock.mockReturnValue(batchDenegado("UPGRADE_REQUIRED"));
    montar();
    expect(screen.queryByTestId("dealer-acceso-no-verificado")).toBeNull();
  });

  it("con todo concedido tampoco, y el menu aparece", () => {
    batchMock.mockReturnValue(batchConcedido());
    montar();
    expect(screen.queryByTestId("dealer-acceso-no-verificado")).toBeNull();
    expect(screen.getByRole("link", { name: /Inventario/ })).toBeInTheDocument();
  });
});
