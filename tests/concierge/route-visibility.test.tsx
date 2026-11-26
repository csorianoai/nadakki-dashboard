import { render, screen } from "@testing-library/react";
import { usePathname } from "next/navigation";
import { ConciergeHost, esPantallaDelConcesionario } from "@/components/concierge/ConciergeSheet";

jest.mock("next/navigation", () => ({ usePathname: jest.fn() }));
jest.mock("@/lib/api/concierge", () => ({ sendConciergeMessage: jest.fn() }));
jest.mock("@/lib/dealer-management/useDealerManagementBranding", () => ({ useDealerManagementBranding: () => ({ data: { locale: "es-AR", currency: "ARS" } }) }));
jest.mock("@/components/ui/sheet", () => ({ Sheet: ({ children }: any) => <div>{children}</div>, SheetContent: ({ children }: any) => <div>{children}</div> }));
jest.mock("@/components/concierge/ConciergeFab", () => ({ ConciergeFab: () => <button>Concierge</button> }));
const ruta = usePathname as jest.Mock;

it("no se muestra en las pantallas del concesionario", () => {
  ruta.mockReturnValue("/autos/dealer/inventario");
  const { container } = render(<ConciergeHost />);
  expect(container).toBeEmptyDOMElement();
});
it("se muestra en el portal publico", () => {
  ruta.mockReturnValue("/autos/vehiculos");
  render(<ConciergeHost />);
  expect(screen.getByRole("button", { name: "Concierge" })).toBeInTheDocument();
});
it("reconoce solo /autos/dealer y sus subrutas", () => {
  expect(esPantallaDelConcesionario("/autos/dealer")).toBe(true);
  expect(esPantallaDelConcesionario("/autos/dealer/inventario/x")).toBe(true);
  expect(esPantallaDelConcesionario("/autos/dealers-cerca")).toBe(false);
  expect(esPantallaDelConcesionario(null)).toBe(false);
});
