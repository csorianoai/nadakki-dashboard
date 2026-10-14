import { render, screen } from "@testing-library/react";
import { RealtorShell } from "@/components/realtor/shell/RealtorShell";

jest.mock("next/navigation", () => ({ usePathname: () => "/realtor/propietarios" }));
const mockApiFetch = jest.fn();
jest.mock("@/lib/api/fetch-client", () => ({ apiFetch: (...a: unknown[]) => mockApiFetch(...a) }));

beforeEach(() => {
  mockApiFetch.mockReset();
  process.env.NEXT_PUBLIC_REALTOR_PANEL = "1";
});

// Reproduce e2e/realtor/visual/propietarios.spec.ts:39: el centro vivo sigue visible aunque ya no sea fila de la barra.
it("Propietarios (fuera de la barra) se marca vivo en la miga, no como fila de la barra", async () => {
  mockApiFetch.mockResolvedValue({ status: 200 });
  render(<RealtorShell><p>contenido</p></RealtorShell>);
  const el = await screen.findByTestId("center-propietarios");
  expect(el).toHaveAttribute("data-center-state", "live");
  expect(screen.getByTestId("shell-crumb")).toContainElement(el);
  expect(screen.getByTestId("shell-sidebar")).not.toContainElement(el);
});
