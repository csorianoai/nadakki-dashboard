/**
 * Un usuario de concesionario nunca ve la Suite operativa.
 *
 * Verificado en produccion con cajamapaal+carolina: veia la Suite con todos los
 * hubs. La senal es GET /api/v1/autos/me/dealer-context.
 */
import { render, screen, waitFor } from "@testing-library/react";

import { DealerSuiteGate } from "@/components/dealer/DealerSuiteGate";
import { fetchMyDealerContext } from "@/lib/dealer/dealer-context-api";

const replace = jest.fn();
jest.mock("next/navigation", () => ({
  useRouter: () => ({ replace, push: jest.fn() }),
}));

const USER = { id: "u-carolina", email: "carolina@cajamapaal.test" };
jest.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({ user: USER }),
}));

jest.mock("@/lib/dealer/dealer-context-api", () => ({
  fetchMyDealerContext: jest.fn(),
}));

const fetchMock = fetchMyDealerContext as jest.MockedFunction<typeof fetchMyDealerContext>;

function montar() {
  return render(
    <DealerSuiteGate>
      <nav>Suite operativa</nav>
    </DealerSuiteGate>,
  );
}

beforeEach(() => {
  replace.mockReset();
  fetchMock.mockReset();
  jest.spyOn(console, "warn").mockImplementation(() => {});
});

afterEach(() => jest.restoreAllMocks());

test("mientras consulta pinta 'Verificando' y no la Suite", () => {
  fetchMock.mockReturnValue(new Promise(() => {}));
  montar();
  expect(screen.getByTestId("suite-verificando")).toHaveTextContent("Verificando");
  expect(screen.queryByText("Suite operativa")).toBeNull();
});

test("con asignacion de dealer redirige a /autos/dealer y nunca pinta la Suite", async () => {
  fetchMock.mockResolvedValue([
    { dealerId: "d1", organizationUnitId: null, dealerName: "Mapaal" },
  ]);
  montar();
  await waitFor(() => expect(replace).toHaveBeenCalledWith("/autos/dealer"));
  expect(screen.getByTestId("suite-redirigiendo-dealer")).toBeInTheDocument();
  expect(screen.queryByText("Suite operativa")).toBeNull();
});

test("sin asignaciones pinta la Suite", async () => {
  fetchMock.mockResolvedValue([]);
  montar();
  expect(await screen.findByText("Suite operativa")).toBeInTheDocument();
  expect(replace).not.toHaveBeenCalled();
});

test("si la consulta falla no expulsa a nadie: pinta la Suite", async () => {
  fetchMock.mockRejectedValue(new Error("HTTP 503"));
  montar();
  expect(await screen.findByText("Suite operativa")).toBeInTheDocument();
  expect(replace).not.toHaveBeenCalled();
});

test("se pregunta una vez, no en cada render", async () => {
  fetchMock.mockResolvedValue([]);
  const { rerender } = montar();
  await screen.findByText("Suite operativa");
  rerender(
    <DealerSuiteGate>
      <nav>Suite operativa</nav>
    </DealerSuiteGate>,
  );
  expect(fetchMock).toHaveBeenCalledTimes(1);
});
