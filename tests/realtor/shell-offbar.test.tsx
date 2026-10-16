import { render, screen } from "@testing-library/react";
import { RealtorShell } from "@/components/realtor/shell/RealtorShell";

jest.mock("next/navigation", () => ({ usePathname: () => "/realtor/propietarios" }));
const mockApiFetch = jest.fn();
jest.mock("@/lib/api/fetch-client", () => ({ apiFetch: (...a: unknown[]) => mockApiFetch(...a) }));

beforeEach(() => {
  mockApiFetch.mockReset();
  process.env.NEXT_PUBLIC_REALTOR_PANEL = "1";
});

// Decisión de César 2026-10-16: Propietarios es fila de la barra (sustituye a dashboard#835) y la miga lo nombra.
it("Propietarios es fila viva de la barra y la miga lo nombra", async () => {
  mockApiFetch.mockResolvedValue({ status: 200 });
  render(<RealtorShell><p>contenido</p></RealtorShell>);
  const el = await screen.findByTestId("center-propietarios");
  expect(el).toHaveAttribute("data-center-state", "live");
  expect(screen.getByTestId("shell-sidebar")).toContainElement(el);
  expect(screen.getByTestId("shell-crumb")).toHaveTextContent("Propietarios");
});
