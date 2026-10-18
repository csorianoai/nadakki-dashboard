import { render, screen, waitFor } from "@testing-library/react";
import AltaPage from "@/app/realtor/alta/page";

const mockApiFetch = jest.fn();
jest.mock("@/lib/api/fetch-client", () => ({ apiFetch: (...a: unknown[]) => mockApiFetch(...a) }));

const acceso = (demo: boolean) => ({ status: 200, json: async () => ({ ok: true, roles: [], demo }) });

beforeEach(() => {
  mockApiFetch.mockReset();
  process.env.NEXT_PUBLIC_REALTOR_PANEL = "1";
  process.env.NEXT_PUBLIC_REALTOR_ALLOW_DEMO = "1";
});

it("tenant real (demo=false) con ALLOW_DEMO=1: /realtor/alta no pinta badge-demo", async () => {
  mockApiFetch.mockResolvedValue(acceso(false));
  render(<AltaPage />);
  await screen.findByTestId("realtor-alta");
  expect(screen.queryByTestId("badge-demo")).toBeNull();
});

it("tenant demo (demo=true) con ALLOW_DEMO=1: badge-demo presente", async () => {
  mockApiFetch.mockResolvedValue(acceso(true));
  render(<AltaPage />);
  await waitFor(() => expect(screen.getByTestId("badge-demo")).toBeInTheDocument());
});

it("demo=true sin ALLOW_DEMO: sin badge-demo", async () => {
  delete process.env.NEXT_PUBLIC_REALTOR_ALLOW_DEMO;
  mockApiFetch.mockResolvedValue(acceso(true));
  render(<AltaPage />);
  await screen.findByTestId("realtor-alta");
  expect(screen.queryByTestId("badge-demo")).toBeNull();
});

it("/acceso 403: no se pinta el asistente", async () => {
  mockApiFetch.mockResolvedValue({ status: 403, json: async () => ({}) });
  const { container } = render(<AltaPage />);
  await waitFor(() => expect(mockApiFetch).toHaveBeenCalled());
  expect(container).toBeEmptyDOMElement();
});
