import { fireEvent, render, screen } from "@testing-library/react";
import { SelectorPeriodo } from "@/components/analytics/kit";

describe("SelectorPeriodo", () => {
  it("expone un radiogroup con 4 opciones y marca la activa", () => {
    render(<SelectorPeriodo valor={{ tipo: "30d" }} onChange={() => {}} />);
    expect(screen.getByRole("radiogroup", { name: /periodo/i })).toBeInTheDocument();
    expect(screen.getAllByRole("radio")).toHaveLength(4);
    expect(screen.getByRole("radio", { name: "30 días" })).toHaveAttribute("aria-checked", "true");
    expect(screen.getByRole("radio", { name: "7 días" })).toHaveAttribute("aria-checked", "false");
  });
  it("solo la opcion activa es tabulable (roving tabindex)", () => {
    render(<SelectorPeriodo valor={{ tipo: "30d" }} onChange={() => {}} />);
    expect(screen.getByRole("radio", { name: "30 días" })).toHaveAttribute("tabindex", "0");
    expect(screen.getByRole("radio", { name: "7 días" })).toHaveAttribute("tabindex", "-1");
  });
  it("clic cambia el periodo", () => {
    const onChange = jest.fn();
    render(<SelectorPeriodo valor={{ tipo: "30d" }} onChange={onChange} />);
    fireEvent.click(screen.getByRole("radio", { name: "90 días" }));
    expect(onChange).toHaveBeenCalledWith({ tipo: "90d" });
  });
  it("flechas del teclado mueven la seleccion", () => {
    const onChange = jest.fn();
    render(<SelectorPeriodo valor={{ tipo: "30d" }} onChange={onChange} />);
    fireEvent.keyDown(screen.getByRole("radio", { name: "30 días" }), { key: "ArrowRight" });
    expect(onChange).toHaveBeenLastCalledWith({ tipo: "90d" });
    fireEvent.keyDown(screen.getByRole("radio", { name: "30 días" }), { key: "ArrowLeft" });
    expect(onChange).toHaveBeenLastCalledWith({ tipo: "7d" });
  });
  it("las flechas dan la vuelta en los extremos", () => {
    const onChange = jest.fn();
    render(<SelectorPeriodo valor={{ tipo: "7d" }} onChange={onChange} />);
    fireEvent.keyDown(screen.getByRole("radio", { name: "7 días" }), { key: "ArrowLeft" });
    expect(onChange).toHaveBeenLastCalledWith({ tipo: "personalizado", desde: "", hasta: "" });
  });
  it("personalizado muestra dos fechas con etiqueta", () => {
    render(<SelectorPeriodo valor={{ tipo: "personalizado", desde: "2026-10-01", hasta: "2026-10-31" }} onChange={() => {}} />);
    expect(screen.getByLabelText("Desde")).toHaveValue("2026-10-01");
    expect(screen.getByLabelText("Hasta")).toHaveValue("2026-10-31");
  });
  it("rango invertido muestra error y no emite", () => {
    const onChange = jest.fn();
    render(<SelectorPeriodo valor={{ tipo: "personalizado", desde: "2026-10-01", hasta: "2026-10-31" }} onChange={onChange} />);
    fireEvent.change(screen.getByLabelText("Desde"), { target: { value: "2026-11-15" } });
    expect(screen.getByRole("alert")).toHaveTextContent(/anterior|posterior|rango/i);
    expect(onChange).not.toHaveBeenCalled();
  });
  it("rango valido emite", () => {
    const onChange = jest.fn();
    render(<SelectorPeriodo valor={{ tipo: "personalizado", desde: "2026-10-01", hasta: "2026-10-31" }} onChange={onChange} />);
    fireEvent.change(screen.getByLabelText("Hasta"), { target: { value: "2026-11-05" } });
    expect(onChange).toHaveBeenCalledWith({ tipo: "personalizado", desde: "2026-10-01", hasta: "2026-11-05" });
  });
});
