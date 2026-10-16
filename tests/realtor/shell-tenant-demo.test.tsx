import { render, screen, waitFor } from "@testing-library/react";
import { RealtorShell } from "@/components/realtor/shell/RealtorShell";
import { fetchPanelAccessInfo } from "@/lib/realtor/access";

jest.mock("next/navigation", () => ({ usePathname: () => "/realtor/mi-dia" }));
const mockApiFetch = jest.fn();
jest.mock("@/lib/api/fetch-client", () => ({ apiFetch: (...a: unknown[]) => mockApiFetch(...a) }));

beforeEach(() => {
  mockApiFetch.mockReset();
  process.env.NEXT_PUBLIC_REALTOR_PANEL = "1";
  delete process.env.NEXT_PUBLIC_REALTOR_ALLOW_DEMO;
});

const body = (b: Record<string, unknown>) => ({ status: 200, json: async () => ({ ok: true, roles: [], ...b }) });

it("demo:true en /acceso muestra el aviso de tenant DEMO, sin píldora del entorno", async () => {
  mockApiFetch.mockResolvedValue(body({ demo: true }));
  render(<RealtorShell><p>x</p></RealtorShell>);
  expect(await screen.findByTestId("tenant-demo")).toHaveTextContent("Tenant DEMO · los datos de este espacio son de demostración");
  expect(screen.queryByTestId("demo-pill")).toBeNull();
});

it("el aviso convive con la píldora del entorno", async () => {
  process.env.NEXT_PUBLIC_REALTOR_ALLOW_DEMO = "1";
  mockApiFetch.mockResolvedValue(body({ demo: true }));
  render(<RealtorShell><p>x</p></RealtorShell>);
  expect(await screen.findByTestId("tenant-demo")).toBeInTheDocument();
  expect(screen.getByTestId("demo-pill")).toBeInTheDocument();
});

it.each([[false], [undefined], ["true"], [1], [null]])("demo=%p no muestra el aviso", async (demo) => {
  mockApiFetch.mockResolvedValue(body(demo === undefined ? {} : { demo }));
  render(<RealtorShell><p>x</p></RealtorShell>);
  await screen.findByTestId("shell-sidebar");
  expect(screen.queryByTestId("tenant-demo")).toBeNull();
});

it("cuerpo ilegible: no hay aviso", async () => {
  mockApiFetch.mockResolvedValue({ status: 200 });
  render(<RealtorShell><p>x</p></RealtorShell>);
  await screen.findByTestId("shell-sidebar");
  expect(screen.queryByTestId("tenant-demo")).toBeNull();
});

it.each([401, 403])("con %s no hay armazón ni aviso", async (status) => {
  mockApiFetch.mockResolvedValue({ status, json: async () => ({ demo: true }) });
  render(<RealtorShell><p>x</p></RealtorShell>);
  await waitFor(() => expect(mockApiFetch).toHaveBeenCalled());
  expect(screen.queryByTestId("realtor-shell")).toBeNull();
  expect(screen.queryByTestId("tenant-demo")).toBeNull();
});

it("fetchPanelAccessInfo devuelve demo y ninguna petición lleva tenant", async () => {
  mockApiFetch.mockResolvedValue(body({ demo: true }));
  expect((await fetchPanelAccessInfo()).demo).toBe(true);
  for (const [path, init] of mockApiFetch.mock.calls) {
    expect(JSON.stringify(init)).not.toMatch(/tenant/i);
    expect(String(path)).not.toMatch(/tenant/i);
  }
});
