import { render, screen } from "@testing-library/react";
import { ResultadosPanel } from "@/components/realtor/resultados/ResultadosPanel";

const mockApiFetch = jest.fn();
jest.mock("@/lib/api/fetch-client", () => ({ apiFetch: (...a: unknown[]) => mockApiFetch(...a) }));

beforeEach(() => {
  mockApiFetch.mockReset();
  process.env.NEXT_PUBLIC_REALTOR_PANEL = "1";
  delete process.env.NEXT_PUBLIC_REALTOR_ALLOW_DEMO;
});

it("con DEMO: marca, embudo, tiempos y orígenes", async () => {
  process.env.NEXT_PUBLIC_REALTOR_ALLOW_DEMO = "1";
  mockApiFetch.mockResolvedValue({ status: 200, json: async () => ({ demo: true }) });
  render(<ResultadosPanel />);
  expect(await screen.findByTestId("demo-banner")).toHaveTextContent("DEMO · datos sintéticos");
  expect(screen.getByTestId("funnel-cierres")).toHaveTextContent("12");
  expect(screen.getByTestId("days-visitas")).toHaveTextContent("9 días");
  expect(screen.getByTestId("origin-portales")).toHaveTextContent("96");
  expect(screen.queryByTestId("resultados-empty")).toBeNull();
});

it("sin DEMO: «Sin datos todavía», sin cifras ni gráficos", async () => {
  mockApiFetch.mockResolvedValue({ status: 200, json: async () => ({ demo: true }) });
  render(<ResultadosPanel />);
  expect(await screen.findByTestId("resultados-empty")).toHaveTextContent("Sin datos todavía");
  expect(screen.queryByTestId("demo-banner")).toBeNull();
  expect(screen.queryByTestId("funnel-leads")).toBeNull();
  expect(screen.queryByTestId("conversion")).toBeNull();
});

it("sin 200 de /acceso no se pinta nada", async () => {
  process.env.NEXT_PUBLIC_REALTOR_ALLOW_DEMO = "1";
  mockApiFetch.mockResolvedValue({ status: 403 });
  render(<ResultadosPanel />);
  expect(await screen.findByTestId("realtor-notice")).toBeInTheDocument();
  expect(screen.queryByTestId("resultados-panel")).toBeNull();
});
