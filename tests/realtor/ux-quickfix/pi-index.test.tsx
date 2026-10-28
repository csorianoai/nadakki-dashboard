import { fireEvent, render, screen } from "@testing-library/react";
import PropertyIntelIndexPage from "@/app/realtor/property-intel/page";
import { RT } from "@/lib/realtor/tokens";

/** ROP-UX-QUICKFIX: el índice de Inteligencia de propiedad tiene un campo con etiqueta visible y borde, y botones reales. */
const push = jest.fn();
jest.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));
jest.mock("@/lib/api/fetch-client", () => ({ apiFetch: jest.fn(), getAuthHeaders: () => ({}) }));

const ID = "0b9f6d3e-1a2b-4c3d-8e4f-5a6b7c8d9e0f";
beforeEach(() => push.mockReset());

describe("negativos primero", () => {
  it("un id no válido marca el campo inválido, enlaza el error y no navega", () => {
    render(<PropertyIntelIndexPage />);
    const input = screen.getByLabelText("Identificador de la propiedad o unidad");
    fireEvent.change(input, { target: { value: "abc" } });
    fireEvent.click(screen.getByRole("button", { name: "Buscar propiedad" }));
    const err = screen.getByRole("alert");
    expect(err).toHaveTextContent("Identificador no válido");
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(input.getAttribute("aria-describedby")).toContain(err.id);
    expect(push).not.toHaveBeenCalled();
  });
  it("Enter con el campo vacío tampoco navega", () => {
    render(<PropertyIntelIndexPage />);
    fireEvent.submit(screen.getByTestId("pi-form"));
    expect(push).not.toHaveBeenCalled();
    expect(screen.getByRole("alert")).toBeInTheDocument();
  });
});

describe("positivos", () => {
  it("la etiqueta es visible (no solo aria-label) y el campo tiene borde de control", () => {
    render(<PropertyIntelIndexPage />);
    const label = screen.getByText("Identificador de la propiedad o unidad");
    expect(label.tagName).toBe("LABEL");
    const input = screen.getByLabelText("Identificador de la propiedad o unidad");
    expect(input).not.toHaveAttribute("aria-label");
    expect(input.style.border).toContain("1px solid");
    expect(input.style.border.toLowerCase()).toContain(hexToRgb(RT.control));
  });
  it("los dos botones son botones reales: uno principal (submit) y uno secundario", () => {
    render(<PropertyIntelIndexPage />);
    const principal = screen.getByRole("button", { name: "Buscar propiedad" });
    const secundario = screen.getByRole("button", { name: "Buscar unidad" });
    expect(principal).toHaveAttribute("type", "submit");
    expect(secundario).toHaveAttribute("type", "button");
    expect(principal.style.background).not.toBe("");
    expect(secundario.style.border).toContain("1px solid");
  });
  it("Enter envía como «Buscar propiedad» y el secundario busca la unidad", () => {
    render(<PropertyIntelIndexPage />);
    fireEvent.change(screen.getByLabelText("Identificador de la propiedad o unidad"), { target: { value: ID } });
    fireEvent.submit(screen.getByTestId("pi-form"));
    expect(push).toHaveBeenCalledWith(`/realtor/property-intel/${ID}`);
    fireEvent.click(screen.getByRole("button", { name: "Buscar unidad" }));
    expect(push).toHaveBeenCalledWith(`/realtor/property-intel/${ID}?unit=${ID}`);
  });
  it("ES/EN: el conmutador pasa toda la pantalla a inglés", () => {
    render(<PropertyIntelIndexPage />);
    fireEvent.click(screen.getByTestId("lang-en"));
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Property intelligence");
    expect(screen.getByLabelText("Property or unit ID")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Find property" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Find unit" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Find property" }));
    expect(screen.getByRole("alert")).toHaveTextContent("Invalid ID");
    expect(screen.getByTestId("pi-index")).toHaveAttribute("lang", "en");
  });
});

function hexToRgb(hex: string): string {
  const n = parseInt(hex.slice(1), 16);
  return `rgb(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255})`;
}
