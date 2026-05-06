import { fireEvent, render, screen, within } from "@testing-library/react";
import { PracticeAreaChip } from "@/components/legal/PracticeAreaChip";

describe("PracticeAreaChip", () => {
  it("renderiza display_es por defecto, no display_en", () => {
    render(<PracticeAreaChip tag="bancario" />);
    expect(screen.getByText("Bancario")).toBeInTheDocument();
    expect(screen.queryByText("Banking")).not.toBeInTheDocument();
  });

  it("renderiza slug crudo si tag no existe en registry (fallback)", () => {
    render(<PracticeAreaChip tag="desconocido_xyz" />);
    expect(screen.getByText("desconocido_xyz")).toBeInTheDocument();
  });

  it("variante 'outlined' usa border, no fill", () => {
    const { container } = render(<PracticeAreaChip tag="civil" variant="outlined" />);
    const el = container.querySelector("span[aria-label^='Área:']");
    expect(el).toBeTruthy();
    const style = (el as HTMLElement).style;
    expect(style.backgroundColor).toBe("transparent");
  });

  it("removable=true llama onRemove al click en X", () => {
    const onRemove = jest.fn();
    render(<PracticeAreaChip tag="laboral" removable onRemove={onRemove} />);
    fireEvent.click(screen.getByLabelText("Remover Laboral"));
    expect(onRemove).toHaveBeenCalledTimes(1);
  });

  it("aria-label es 'Área: <nombre>' en español", () => {
    render(<PracticeAreaChip tag="penal" />);
    expect(screen.getByLabelText("Área: Penal")).toBeInTheDocument();
  });

  it("showTooltip=true muestra description_es como title", () => {
    render(<PracticeAreaChip tag="tributario" showTooltip />);
    const el = screen.getByLabelText("Área: Tributario");
    expect(el).toHaveAttribute("title", expect.stringContaining("DGII"));
  });
});
