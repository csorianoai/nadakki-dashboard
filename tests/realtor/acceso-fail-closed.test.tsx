import { render, screen, waitFor } from "@testing-library/react";
import { RealtorShell } from "@/components/realtor/shell/RealtorShell";
import { MiDiaPanel } from "@/components/realtor/mi-dia/MiDiaPanel";
import { fetchPanelAccessInfo } from "@/lib/realtor/access";

jest.mock("next/navigation", () => ({ usePathname: () => "/realtor/mi-dia" }));
const mockApiFetch = jest.fn();
jest.mock("@/lib/api/fetch-client", () => ({ apiFetch: (...a: unknown[]) => mockApiFetch(...a) }));

beforeEach(() => {
  mockApiFetch.mockReset();
  process.env.NEXT_PUBLIC_REALTOR_PANEL = "1";
  delete process.env.NEXT_PUBLIC_REALTOR_ALLOW_DEMO;
});

const ok = (demo: boolean) => ({ status: 200, json: async () => ({ ok: true, roles: [], demo }) });
const DEMO_IDS = ["demo-pill", "demo-reset", "mi-dia-demo"];
const page = () => <RealtorShell><MiDiaPanel /></RealtorShell>;

it("(a) /acceso 403: ni píldora, ni «Vista simulada», ni reinicio, ni SYNTH; sale el copy sin-acceso", async () => {
  process.env.NEXT_PUBLIC_REALTOR_ALLOW_DEMO = "1";
  mockApiFetch.mockResolvedValue({ status: 403, json: async () => ({ demo: true }) });
  const { container } = render(page());
  await waitFor(() => expect(screen.getByTestId("realtor-notice")).toHaveAttribute("data-reason", "sin-acceso"));
  DEMO_IDS.forEach((id) => expect(screen.queryByTestId(id)).toBeNull());
  expect(container.querySelector("#vista-nota")).toBeNull();
  expect(screen.queryByText(/Vista simulada/)).toBeNull();
});

it("(a) /acceso con error de red: aviso de error, sin demo", async () => {
  process.env.NEXT_PUBLIC_REALTOR_ALLOW_DEMO = "1";
  mockApiFetch.mockRejectedValue(new Error("red"));
  render(page());
  await waitFor(() => expect(screen.getByTestId("realtor-notice")).toHaveAttribute("data-reason", "error"));
  DEMO_IDS.forEach((id) => expect(screen.queryByTestId(id)).toBeNull());
});

it("(b) 200 demo=false con ALLOW_DEMO=1: sin DEMO ni SYNTH", async () => {
  process.env.NEXT_PUBLIC_REALTOR_ALLOW_DEMO = "1";
  mockApiFetch.mockResolvedValue(ok(false));
  const { container } = render(page());
  await screen.findByTestId("realtor-shell");
  await screen.findByTestId("mi-dia-panel");
  DEMO_IDS.forEach((id) => expect(screen.queryByTestId(id)).toBeNull());
  expect(container.querySelector("#vista-nota")).toBeNull();
});

it("(c) 200 demo=true con ALLOW_DEMO=1: píldora, vista simulada y reinicio", async () => {
  process.env.NEXT_PUBLIC_REALTOR_ALLOW_DEMO = "1";
  mockApiFetch.mockResolvedValue(ok(true));
  render(page());
  expect(await screen.findByTestId("demo-pill")).toBeInTheDocument();
  expect(screen.getByTestId("demo-reset")).toBeInTheDocument();
  expect(screen.getByText("Vista simulada")).toBeInTheDocument();
});

it("(d) 200 demo=true sin ALLOW_DEMO: sin DEMO", async () => {
  mockApiFetch.mockResolvedValue(ok(true));
  render(page());
  await screen.findByTestId("mi-dia-panel");
  DEMO_IDS.forEach((id) => expect(screen.queryByTestId(id)).toBeNull());
});

it("(f) /acceso no envía X-Tenant-ID ni nada de tenant", async () => {
  mockApiFetch.mockResolvedValue(ok(false));
  await fetchPanelAccessInfo();
  await waitFor(() => expect(mockApiFetch).toHaveBeenCalledTimes(1));
  const [path, init] = mockApiFetch.mock.calls[0];
  expect(path).toBe("/api/v1/realestate/acceso");
  expect(new Headers((init as RequestInit).headers ?? undefined).has("x-tenant-id")).toBe(false);
  expect(JSON.stringify(init)).not.toMatch(/tenant/i);
});
