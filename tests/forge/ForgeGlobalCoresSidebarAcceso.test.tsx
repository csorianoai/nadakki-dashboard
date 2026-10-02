/**
 * El sidebar dice por que esta vacio, y lo PREGUNTA.
 *
 * Fail-closed no puede significar "menu vacio sin explicacion": un menu vacio por
 * `no_organization_unit` es indistinguible de "tu plan no incluye ningun modulo",
 * y son dos cosas distintas.
 *
 * Lo que cambia respecto de la primera version: el estado NO se deduce de que el
 * cliente no tenga `organizationUnitId`. El backend resuelve la unidad desde
 * `user_dealer_assignments` cuando el batch no la recibe, asi que un cliente sin
 * unidad es un caso VALIDO. El sidebar pide el batch --sin
 * `organization_unit_id`, que es lo que `batchSearch` hace cuando no hay unidad--
 * y decide por los `reason_code` de la respuesta.
 *
 * Los codigos llegan POR CAPABILITY dentro de un 200, asi que los casos siembran
 * items denegados. Hay uno aparte para el 403, donde si viajan en el error.
 *
 * Se mide el COMPONENTE: una copia correcta que nadie pinta no se la lee nadie.
 */
import { render, screen } from "@testing-library/react";

import { ForgeGlobalCoresSidebar } from "@/components/forge/layout/ForgeGlobalCoresSidebar";
import {
  ACCESS_UNVERIFIED_MESSAGE,
  SUITE_ACCESS_PROBE_CAPABILITIES,
} from "@/components/forge/layout/forge-global-sidebar-nav";
import { AccessApiError } from "@/lib/access/client";
import { MIGRATION_097_CAPABILITY_KEYS } from "@/lib/dealer/core-status";

jest.mock("next/navigation", () => ({
  usePathname: () => "/credit-hub",
}));

let tenant: { id: string; slug: string; display_name: string; subscribed_cores?: string[] } | null = null;
let allRoles: { core_name: string; role_key: string }[] = [];

jest.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({
    tenant,
    allRoles,
    user: { email: "caja@mapaal.com", name: "Caja" },
    activeRole: allRoles[0] ?? null,
    isAuthenticated: true,
  }),
}));

jest.mock("@/lib/hooks/useTenantBranding", () => ({
  useTenantBranding: () => ({ data: null, isPending: false, isLoading: false }),
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
        SUITE_ACCESS_PROBE_CAPABILITIES.map((key) => [
          key,
          { allowed: false, reason_code: reasonCode, limit: null, current_usage: null },
        ]),
      ),
    },
  };
}

function batch403(reasonCode: string) {
  return {
    isError: true,
    error: new AccessApiError({
      status: 403,
      reason_code: reasonCode,
      detail: null,
      endpoint: "/api/v1/access/entitlements/batch",
    }),
    isPending: false,
    isLoading: false,
    data: undefined,
  };
}

function montar() {
  return render(<ForgeGlobalCoresSidebar mobileOpen={false} onNavigate={() => {}} />);
}

beforeEach(() => {
  window.localStorage.clear();
  tenant = { id: "t-mapaal", slug: "mapaal", display_name: "Mapaal", subscribed_cores: [] };
  allRoles = [{ core_name: "autos", role_key: "caja" }];
  batchMock.mockReset();
  batchMock.mockReturnValue(batchDenegado("ALLOWED"));
});

describe("cuando el acceso no se pudo verificar", () => {
  it("con no_organization_unit lo dice, en vez de dejar el menu mudo", () => {
    batchMock.mockReturnValue(batchDenegado("no_organization_unit"));
    montar();
    const aviso = screen.getByTestId("suite-acceso-no-verificado");
    expect(aviso).toHaveTextContent(ACCESS_UNVERIFIED_MESSAGE);
    expect(aviso.getAttribute("role")).toBe("alert");
  });

  it("explica que el menu vacio no significa que falten modulos", () => {
    batchMock.mockReturnValue(batchDenegado("no_organization_unit"));
    montar();
    expect(screen.getByTestId("suite-acceso-no-verificado")).toHaveTextContent(
      /no porque no tengas módulos/i,
    );
  });

  it("deja ver el codigo, para que soporte sepa que mirar", () => {
    batchMock.mockReturnValue(batchDenegado("no_organization_unit"));
    montar();
    expect(screen.getByTestId("suite-acceso-no-verificado")).toHaveAttribute(
      "data-reason-code",
      "no_organization_unit",
    );
  });

  it("vale igual con el codigo en mayusculas", () => {
    batchMock.mockReturnValue(batchDenegado("NO_ORGANIZATION_UNIT"));
    montar();
    expect(screen.getByTestId("suite-acceso-no-verificado")).toBeInTheDocument();
  });

  it("y con no_beneficiary_entitlement", () => {
    batchMock.mockReturnValue(batchDenegado("no_beneficiary_entitlement"));
    montar();
    expect(screen.getByTestId("suite-acceso-no-verificado")).toBeInTheDocument();
  });

  it("tambien cuando llega como 403, no solo como item denegado", () => {
    batchMock.mockReturnValue(batch403("no_organization_unit"));
    montar();
    expect(screen.getByTestId("suite-acceso-no-verificado")).toBeInTheDocument();
  });

  it("no afirma que el modulo no este en el plan", () => {
    batchMock.mockReturnValue(batchDenegado("no_organization_unit"));
    montar();
    expect(screen.queryByText(/no disponible en tu plan/i)).toBeNull();
  });
});

describe("se pregunta, no se deduce", () => {
  /**
   * Un cliente sin unidad organizativa es un caso VALIDO: el backend la resuelve
   * desde `user_dealer_assignments`. Si el sidebar volviera a deducir el estado de
   * la ausencia de unidad en el cliente, pintaria el aviso con un batch que
   * concede. Este caso es el que lo impide.
   */
  it("un batch que concede no pinta aviso, aunque el cliente no tenga unidad", () => {
    batchMock.mockReturnValue({
      isError: false,
      error: null,
      isPending: false,
      isLoading: false,
      data: {
        scope: "tenant",
        unitScope: "omitted",
        results: Object.fromEntries(
          SUITE_ACCESS_PROBE_CAPABILITIES.map((key) => [
            key,
            { allowed: true, reason_code: "ALLOWED", limit: null, current_usage: null },
          ]),
        ),
      },
    });
    montar();
    expect(screen.queryByTestId("suite-acceso-no-verificado")).toBeNull();
  });

  it("mientras la sonda carga no se afirma nada", () => {
    batchMock.mockReturnValue({
      isError: false,
      error: null,
      isPending: true,
      isLoading: true,
      data: undefined,
    });
    montar();
    expect(screen.queryByTestId("suite-acceso-no-verificado")).toBeNull();
  });

  /**
   * react-query conserva el dato anterior mientras refetchea. Sin el guardia de
   * carga, un refetch en vuelo con datos viejos denegados pintaria el aviso como
   * si fuera la respuesta actual. Este caso es el que obliga al guardia: el de
   * arriba no lo hace, porque sin `data` el lector devuelve null de todos modos.
   */
  it("un refetch en vuelo con datos viejos denegados tampoco afirma", () => {
    batchMock.mockReturnValue({
      ...batchDenegado("no_organization_unit"),
      isPending: true,
      isLoading: true,
    });
    montar();
    expect(screen.queryByTestId("suite-acceso-no-verificado")).toBeNull();
  });

  it("las claves de la sonda son reales: todas estan en el catalogo 097", () => {
    montar();
    expect(batchMock).toHaveBeenCalledWith([...SUITE_ACCESS_PROBE_CAPABILITIES]);
    for (const key of SUITE_ACCESS_PROBE_CAPABILITIES) {
      expect(MIGRATION_097_CAPABILITY_KEYS.has(key)).toBe(true);
    }
  });

  it("la sonda cubre los cinco cores que el catalogo 097 tiene", () => {
    const prefijos = SUITE_ACCESS_PROBE_CAPABILITIES.map((key) => key.split(".")[0]);
    expect([...prefijos].sort()).toEqual(["accounting", "autos", "credit", "legal", "marketing"]);
  });
});

describe("cuando el acceso si se verifico", () => {
  it("sin cores suscritos no se pinta el aviso de verificacion", () => {
    montar();
    expect(screen.queryByTestId("suite-acceso-no-verificado")).toBeNull();
  });

  it("una denegacion por plan tampoco lo pinta", () => {
    batchMock.mockReturnValue(batchDenegado("UPGRADE_REQUIRED"));
    montar();
    expect(screen.queryByTestId("suite-acceso-no-verificado")).toBeNull();
  });

  it("con el core suscrito el hub sigue abriendose: el aviso no rompe la navegacion", () => {
    tenant = { id: "t-mapaal", slug: "mapaal", display_name: "Mapaal", subscribed_cores: ["credit"] };
    montar();
    expect(screen.queryByTestId("suite-acceso-no-verificado")).toBeNull();
    expect(screen.getByLabelText("Navegación por módulos")).toBeInTheDocument();
  });
});
