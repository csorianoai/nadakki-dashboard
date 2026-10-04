/**
 * D1 (regresion) · un dealer que entra en /logout SALE de verdad.
 *
 * En produccion, e2e/mapaal/D1.spec.ts paso inventario, red y localStorage, y
 * cayo en "cerrar sesion": /logout acababa en /autos/dealer, sin POST de logout,
 * con el refresh token y nadakki_dealer_id intactos. La causa: AppGate metia
 * /logout en ProtectedRoute + GlobalForgeAppShell, y el shell envuelve todo en
 * DealerSuiteGate (#582). Con una asignacion, el gate pinta "Verificando…" y
 * luego hace router.replace("/autos/dealer"): la pagina de logout nunca monta.
 *
 * Aqui va el arbol real: AppGate, ProtectedRoute, DealerSuiteGate y la pagina
 * de logout. Solo se sustituye el chrome del shell (fuentes, menus) por el gate,
 * que es lo unico del shell que decide la navegacion.
 *
 * @jest-environment jsdom
 */

import { render, waitFor } from "@testing-library/react";

const mockPush = jest.fn();
const mockReplace = jest.fn();
const mockLogout = jest.fn(async () => {});
const mockFetchMyDealerContext = jest.fn();

jest.mock("next/navigation", () => ({
  usePathname: jest.fn(() => "/logout"),
  useRouter: () => ({ push: mockPush, replace: mockReplace }),
}));

jest.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({
    user: { id: "user-qa" },
    isAuthenticated: true,
    isLoading: false,
    initError: null,
    retryInit: jest.fn(),
    logout: mockLogout,
  }),
}));

jest.mock("@/lib/dealer/dealer-context-api", () => ({
  fetchMyDealerContext: () => mockFetchMyDealerContext(),
}));

jest.mock("@/components/ai/OnboardingAgent", () => ({
  __esModule: true,
  default: () => null,
}));

// El shell real envuelve su chrome en DealerSuiteGate; aqui solo el gate.
jest.mock("@/components/forge/layout/GlobalForgeAppShell", () => {
  const { DealerSuiteGate } = jest.requireActual("@/components/dealer/DealerSuiteGate");
  return {
    GlobalForgeAppShell: ({ children }: { children: React.ReactNode }) => (
      <DealerSuiteGate>{children}</DealerSuiteGate>
    ),
  };
});

import LogoutPage from "@/app/(public)/logout/page";
import AppGate from "@/components/auth/AppGate";

describe("AppGate · /logout con un usuario de dealer", () => {
  beforeEach(() => {
    mockPush.mockClear();
    mockReplace.mockClear();
    mockLogout.mockClear();
    mockFetchMyDealerContext.mockReset();
    mockFetchMyDealerContext.mockResolvedValue([
      { dealerId: "dealer-qa", organizationUnitId: "unidad-qa", dealerName: "Dealer QA" },
    ]);
  });

  it("ejecuta el logout y va a /login, sin pasar por el panel del dealer", async () => {
    render(
      <AppGate>
        <LogoutPage />
      </AppGate>,
    );

    await waitFor(() => expect(mockLogout).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(mockPush).toHaveBeenCalledWith("/login"));
    expect(mockReplace).not.toHaveBeenCalledWith("/autos/dealer");
  });

  it("no pregunta dealer-context en /logout: la Suite no se interpone", async () => {
    render(
      <AppGate>
        <LogoutPage />
      </AppGate>,
    );

    await waitFor(() => expect(mockPush).toHaveBeenCalledWith("/login"));
    expect(mockFetchMyDealerContext).not.toHaveBeenCalled();
  });
});
