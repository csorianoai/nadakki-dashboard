/**
 * Regresion D2b: la Suite operativa (GlobalForgeAppShell) pasa SIEMPRE por
 * DealerSuiteGate. Si alguien quita el gate del shell, un usuario de dealer
 * vuelve a ver Legal Hub, Nauta, SIC Hub... y este test se pone rojo.
 */
import { render, screen, waitFor } from "@testing-library/react";

import { GlobalForgeAppShell } from "@/components/forge/layout/GlobalForgeAppShell";
import { fetchMyDealerContext } from "@/lib/dealer/dealer-context-api";

const replace = jest.fn();
jest.mock("next/navigation", () => ({
  useRouter: () => ({ replace, push: jest.fn() }),
  usePathname: () => "/",
}));

jest.mock("next/font/google", () => {
  const font = () => ({ variable: "", className: "" });
  return { Inter: font, JetBrains_Mono: font, Source_Serif_4: font };
});

jest.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({ user: { id: "u-carolina" } }),
}));

jest.mock("@/lib/dealer/dealer-context-api", () => ({
  fetchMyDealerContext: jest.fn(),
}));

jest.mock("@/components/forge/layout/ForgeGlobalCoresSidebar", () => ({
  ForgeGlobalCoresSidebar: () => <nav>Suite operativa</nav>,
}));
jest.mock("@/components/forge/layout/ForgeGlobalTopbar", () => ({
  ForgeGlobalTopbar: () => <header>topbar</header>,
}));
jest.mock("@/components/white-label/TenantBrandedDocumentTitle", () => ({
  TenantBrandedDocumentTitle: () => null,
}));

const fetchMock = fetchMyDealerContext as jest.MockedFunction<typeof fetchMyDealerContext>;

beforeEach(() => {
  replace.mockReset();
  fetchMock.mockReset();
});

test("un usuario con dealer no ve la Suite: el shell lo manda a /autos/dealer", async () => {
  fetchMock.mockResolvedValue([{ dealerId: "d1", organizationUnitId: null, dealerName: "Mapaal" }]);
  render(<GlobalForgeAppShell>contenido</GlobalForgeAppShell>);
  await waitFor(() => expect(replace).toHaveBeenCalledWith("/autos/dealer"));
  expect(screen.queryByText("Suite operativa")).toBeNull();
  expect(screen.queryByText("contenido")).toBeNull();
});

test("sin dealer el shell pinta la Suite", async () => {
  fetchMock.mockResolvedValue([]);
  render(<GlobalForgeAppShell>contenido</GlobalForgeAppShell>);
  expect(await screen.findByText("Suite operativa")).toBeInTheDocument();
  expect(screen.getByText("contenido")).toBeInTheDocument();
  expect(replace).not.toHaveBeenCalled();
});
