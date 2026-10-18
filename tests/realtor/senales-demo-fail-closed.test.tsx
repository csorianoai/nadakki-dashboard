import { render, screen, waitFor } from "@testing-library/react";
import { SignalsCenter } from "@/components/marketing/signals/SignalsCenter";

// PS-10 (auditor 12:53 sobre dash#953): /realtor/demand-radar/senales decidía la demo solo por el entorno; con /acceso
// 200 demo=false y ALLOW_DEMO=1 un tenant real veía «Datos DEMO» y la señal sintética.
const mockApiFetch = jest.fn();
jest.mock("@/lib/api/fetch-client", () => ({
  apiFetch: (...a: unknown[]) => mockApiFetch(...a),
  getAuthHeaders: () => ({}),
}));

beforeEach(() => {
  mockApiFetch.mockReset();
  process.env.NEXT_PUBLIC_REALTOR_PANEL = "1";
  delete process.env.NEXT_PUBLIC_REALTOR_ALLOW_DEMO;
});

const acceso = (demo: boolean) => ({ status: 200, json: async () => ({ ok: true, roles: [], demo }) });

it("200 demo=false con ALLOW_DEMO=1: sin banner DEMO ni señal sintética", async () => {
  process.env.NEXT_PUBLIC_REALTOR_ALLOW_DEMO = "1";
  mockApiFetch.mockResolvedValue(acceso(false));
  render(<SignalsCenter />);
  await screen.findByTestId("signals-center");
  expect(screen.queryByTestId("demo-banner")).toBeNull();
});

it("200 demo=true sin ALLOW_DEMO: sin DEMO", async () => {
  mockApiFetch.mockResolvedValue(acceso(true));
  render(<SignalsCenter />);
  await screen.findByTestId("signals-center");
  expect(screen.queryByTestId("demo-banner")).toBeNull();
});

it("200 demo=true con ALLOW_DEMO=1: DEMO visible (tenant demo)", async () => {
  process.env.NEXT_PUBLIC_REALTOR_ALLOW_DEMO = "1";
  mockApiFetch.mockResolvedValue(acceso(true));
  render(<SignalsCenter />);
  expect(await screen.findByTestId("demo-banner")).toBeInTheDocument();
});

it("/acceso 403 con ALLOW_DEMO=1: aviso y sin DEMO", async () => {
  process.env.NEXT_PUBLIC_REALTOR_ALLOW_DEMO = "1";
  mockApiFetch.mockResolvedValue({ status: 403, json: async () => ({ demo: true }) });
  render(<SignalsCenter />);
  await waitFor(() => expect(screen.getByTestId("realtor-notice")).toBeInTheDocument());
  expect(screen.queryByTestId("demo-banner")).toBeNull();
});
