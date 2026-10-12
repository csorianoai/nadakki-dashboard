import { render, screen, waitFor } from "@testing-library/react";
import { RealtorShell } from "@/components/realtor/shell/RealtorShell";
import { filterCenters, REALTOR_CENTERS } from "@/lib/realtor/centers";

jest.mock("next/navigation", () => ({ usePathname: () => "/realtor/demand-radar" }));
const mockApiFetch = jest.fn();
jest.mock("@/lib/api/fetch-client", () => ({ apiFetch: (...a: unknown[]) => mockApiFetch(...a) }));

beforeEach(() => {
  mockApiFetch.mockReset();
  process.env.NEXT_PUBLIC_REALTOR_PANEL = "1";
  delete process.env.NEXT_PUBLIC_REALTOR_ALLOW_DEMO;
});

it("con 200 pinta el armazón; sin DEMO no hay píldora ni reinicio ni pie", async () => {
  mockApiFetch.mockResolvedValue({ status: 200 });
  render(<RealtorShell><p>contenido</p></RealtorShell>);
  expect(await screen.findByTestId("shell-sidebar")).toBeInTheDocument();
  expect(screen.getByText("contenido")).toBeInTheDocument();
  expect(screen.queryByTestId("demo-pill")).toBeNull();
  expect(screen.queryByTestId("demo-reset")).toBeNull();
  expect(screen.queryByTestId("shell-footer")).toBeNull();
});

it("con DEMO encendido aparecen píldora, reinicio y pie", async () => {
  process.env.NEXT_PUBLIC_REALTOR_ALLOW_DEMO = "1";
  mockApiFetch.mockResolvedValue({ status: 200 });
  render(<RealtorShell><p>contenido</p></RealtorShell>);
  expect(await screen.findByTestId("demo-pill")).toBeInTheDocument();
  expect(screen.getByTestId("demo-reset")).toBeInTheDocument();
  expect(screen.getByTestId("shell-footer")).toBeInTheDocument();
});

it.each([403, 401, 500])("con %s no se pinta el armazón, solo el contenido", async (status) => {
  mockApiFetch.mockResolvedValue({ status });
  render(<RealtorShell><p>contenido</p></RealtorShell>);
  await waitFor(() => expect(mockApiFetch).toHaveBeenCalled());
  expect(screen.getByText("contenido")).toBeInTheDocument();
  expect(screen.queryByTestId("shell-sidebar")).toBeNull();
});

it("con el interruptor apagado no pregunta al backend ni pinta el armazón", () => {
  process.env.NEXT_PUBLIC_REALTOR_PANEL = "0";
  render(<RealtorShell><p>contenido</p></RealtorShell>);
  expect(mockApiFetch).not.toHaveBeenCalled();
  expect(screen.queryByTestId("shell-sidebar")).toBeNull();
});

it("solo Demand Radar enlaza y el filtro busca por nombre", () => {
  expect(REALTOR_CENTERS.filter((c) => c.href).map((c) => c.id)).toEqual(["demand-radar"]);
  expect(filterCenters("fin").map((c) => c.id)).toEqual(["finanzas"]);
});
