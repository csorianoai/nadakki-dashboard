import { fireEvent, render, screen } from "@testing-library/react";
import { ForgeCreditGuide } from "@/components/credit-hub/system/ForgeCreditGuide";

let pathname = "/credit-hub/dealer";

jest.mock("next/navigation", () => ({
  usePathname: () => pathname,
}));

describe("ForgeCreditGuide", () => {
  beforeEach(() => {
    pathname = "/credit-hub/dealer";
  });

  test("explains dealer dashboard as starting point", () => {
    render(<ForgeCreditGuide />);
    expect(screen.getByText("Punto de inicio")).toBeInTheDocument();
    expect(screen.getByText(/Aqui ves el pulso del portafolio/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Nueva Solicitud" })).toHaveAttribute("href", "/credit-hub/dealer/applications/new");
  });

  test("guides new application without explaining everything at once", () => {
    pathname = "/credit-hub/dealer/applications/new";
    render(<ForgeCreditGuide />);

    expect(screen.getByText("Perfil del cliente")).toBeInTheDocument();
    expect(screen.queryByText("Ingresos")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Siguiente/ }));
    expect(screen.getByText("Ingresos")).toBeInTheDocument();
  });

  test("explains detail as expediente and processing with AI", () => {
    pathname = "/credit-hub/dealer/applications/app-1";
    render(<ForgeCreditGuide />);

    expect(screen.getByText("Expediente crediticio")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Siguiente/ }));
    expect(screen.getByText("Procesar con IA")).toBeInTheDocument();
    expect(screen.getByText(/analiza la solicitud contra casos reales/)).toBeInTheDocument();
  });

  test("can be minimized and reopened", () => {
    render(<ForgeCreditGuide />);
    fireEvent.click(screen.getByRole("button", { name: "Minimizar guia" }));
    expect(screen.getByRole("button", { name: "Abrir guia de credito" })).toBeInTheDocument();
  });
});
