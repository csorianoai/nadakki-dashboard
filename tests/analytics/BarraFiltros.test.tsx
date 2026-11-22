import { fireEvent, render, screen } from "@testing-library/react";
import { BarraFiltros } from "@/components/analytics/kit";

const filtros = [
  { id: "canal", etiqueta: "Canal", valor: "todos", opciones: [{ valor: "todos", etiqueta: "Todos" }, { valor: "ads", etiqueta: "Google Ads" }] },
  { id: "campana", etiqueta: "Campaña", valor: "todos", opciones: [{ valor: "todos", etiqueta: "Todas" }] },
];

describe("BarraFiltros", () => {
  it("cada filtro tiene etiqueta asociada", () => {
    render(<BarraFiltros filtros={filtros} onChange={() => {}} />);
    expect(screen.getByLabelText("Canal")).toBeInTheDocument();
    expect(screen.getByLabelText("Campaña")).toBeInTheDocument();
    expect(screen.getByRole("search", { name: /filtros/i })).toBeInTheDocument();
  });
  it("cambiar un filtro emite id y valor", () => {
    const onChange = jest.fn();
    render(<BarraFiltros filtros={filtros} onChange={onChange} />);
    fireEvent.change(screen.getByLabelText("Canal"), { target: { value: "ads" } });
    expect(onChange).toHaveBeenCalledWith("canal", "ads");
  });
  it("limpiar solo aparece con filtros activos y restablece", () => {
    const onLimpiar = jest.fn();
    const { rerender } = render(<BarraFiltros filtros={filtros} onChange={() => {}} onLimpiar={onLimpiar} />);
    expect(screen.queryByRole("button", { name: /limpiar/i })).toBeNull();
    rerender(<BarraFiltros filtros={[{ ...filtros[0], valor: "ads" }, filtros[1]]} onChange={() => {}} onLimpiar={onLimpiar} />);
    fireEvent.click(screen.getByRole("button", { name: /limpiar/i }));
    expect(onLimpiar).toHaveBeenCalledTimes(1);
  });
  it("sin filtros no pinta nada", () => {
    const { container } = render(<BarraFiltros filtros={[]} onChange={() => {}} />);
    expect(container).toBeEmptyDOMElement();
  });
});
