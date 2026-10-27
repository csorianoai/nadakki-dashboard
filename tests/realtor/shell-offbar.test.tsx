import { render, screen } from "@testing-library/react";
import { RealtorShell } from "@/components/realtor/shell/RealtorShell";
import { migasDe } from "@/lib/migas";

jest.mock("next/navigation", () => ({ usePathname: () => "/realtor/propietarios" }));
const mockApiFetch = jest.fn();
jest.mock("@/lib/api/fetch-client", () => ({ apiFetch: (...a: unknown[]) => mockApiFetch(...a) }));

beforeEach(() => {
  mockApiFetch.mockReset();
  process.env.NEXT_PUBLIC_REALTOR_PANEL = "1";
});

// Decisión de César 2026-10-16: Propietarios es fila de la barra (sustituye a dashboard#835) y la miga lo nombra.
// ROP-UX-QUICKFIX: hay UNA miga, la de la Suite (BarraSuite, migasDe); el armazón ya no pinta la suya.
it("Propietarios es fila viva de la barra y la miga lo nombra", async () => {
  mockApiFetch.mockResolvedValue({ status: 200 });
  render(<RealtorShell><p>contenido</p></RealtorShell>);
  const el = await screen.findByTestId("center-propietarios");
  expect(el).toHaveAttribute("data-center-state", "live");
  expect(screen.getByTestId("shell-sidebar")).toContainElement(el);
  expect(screen.queryByTestId("shell-crumb")).toBeNull();
  expect(migasDe("/realtor/propietarios").map((m) => m.label)).toContain("Propietarios");
});

it.each([
  ["/realtor/smart-calendar", "Smart Calendar"], ["/realtor/mi-dia", "Mi día"], ["/realtor/property-intel", "Inteligencia de propiedad"],
  ["/realtor/operaciones", "Operaciones"], ["/realtor/clientes", "Contactos"],
])("la miga única de %s nombra su centro (antes el armazón decía «Inicio» en Smart Calendar)", (ruta, centro) => {
  const labels = migasDe(ruta).map((m) => m.label);
  expect(labels[labels.length - 1]).toBe(centro);
});
