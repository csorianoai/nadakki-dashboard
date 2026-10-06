import { fireEvent, render, screen } from "@testing-library/react";
import { DccPage } from "@/components/dcc/DccPage";
import { DccGrid, DccPageMarco } from "@/components/dcc/DccPageMarco";
import { marcaDesdeBranding } from "@/lib/dcc/marca";

/** Fuera del shell del dealer el hook lanza: aqui se simula eso mismo. */
const hookDealer = jest.fn(() => {
  throw new Error("useAuth must be used within AuthProvider");
});
jest.mock("@/lib/dealer-management/useDealerManagementBranding", () => ({
  useDealerManagementBranding: () => hookDealer(),
}));

const BANCO = marcaDesdeBranding(
  { display_name: "Banco Ejemplo", logo_url: "https://cdn.example/banco.svg", locale: "es-DO", currency: "DOP" },
  "banco",
);

describe("DccPage con marca (banco, B1)", () => {
  beforeEach(() => hookDealer.mockClear());

  it("con marca no llama al branding del dealer y pinta la marca recibida", () => {
    render(
      <DccPage titulo="Mesa de decisiones" marca={BANCO}>
        <DccGrid>contenido</DccGrid>
      </DccPage>,
    );
    expect(hookDealer).not.toHaveBeenCalled();
    expect(screen.getByRole("heading", { name: "Mesa de decisiones" })).toBeInTheDocument();
    expect(screen.getByTestId("dcc-logo")).toHaveAttribute("src", "https://cdn.example/banco.svg");
  });

  it("DccPageMarco funciona sola y conmuta el tema", () => {
    const { container } = render(
      <DccPageMarco titulo="Bandeja" marca={BANCO}>
        x
      </DccPageMarco>,
    );
    const raiz = container.querySelector("[data-dcc-root]");
    expect(raiz).toHaveAttribute("data-dcc-theme", "light");
    fireEvent.click(screen.getByTestId("dcc-theme-toggle"));
    expect(raiz).toHaveAttribute("data-dcc-theme", "dark");
    expect(hookDealer).not.toHaveBeenCalled();
  });
});
