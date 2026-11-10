import { render, screen } from "@testing-library/react";
import { EstadoAnalitica } from "@/components/analytics/kit";

describe("EstadoAnalitica", () => {
  it("cargando: ocupado y accesible", () => {
    render(<EstadoAnalitica estado="cargando" titulo="Cargando" />);
    const el = screen.getByRole("status");
    expect(el).toHaveAttribute("aria-busy", "true");
    expect(el).toHaveAttribute("data-estado", "cargando");
  });
  it("error: role alert con accion de reintento", () => {
    const onReintentar = jest.fn();
    render(<EstadoAnalitica estado="error" titulo="No se pudo cargar" onReintentar={onReintentar} />);
    expect(screen.getByRole("alert")).toHaveAttribute("data-estado", "error");
    screen.getByRole("button", { name: /reintentar/i }).click();
    expect(onReintentar).toHaveBeenCalledTimes(1);
  });
  it("vacio", () => {
    render(<EstadoAnalitica estado="vacio" titulo="Sin datos en este periodo" />);
    expect(screen.getByRole("status")).toHaveAttribute("data-estado", "vacio");
    expect(screen.getByText("Sin datos en este periodo")).toBeInTheDocument();
  });
  it("datos insuficientes", () => {
    render(<EstadoAnalitica estado="datos_insuficientes" titulo="Datos insuficientes" descripcion="Se necesita un periodo anterior." />);
    expect(screen.getByRole("status")).toHaveAttribute("data-estado", "datos_insuficientes");
    expect(screen.getByText("Se necesita un periodo anterior.")).toBeInTheDocument();
  });
  it("pendiente de integracion con etiqueta visible", () => {
    render(<EstadoAnalitica estado="pendiente_integracion" titulo="Fuente no conectada" />);
    expect(screen.getByRole("status")).toHaveAttribute("data-estado", "pendiente_integracion");
    expect(screen.getByText(/pendiente de integraci/i)).toBeInTheDocument();
  });
  it("titulos por defecto en espanol para cada estado", () => {
    const estados = ["cargando", "error", "vacio", "datos_insuficientes", "pendiente_integracion"] as const;
    for (const e of estados) {
      const { unmount } = render(<EstadoAnalitica estado={e} />);
      const nombre = e === "cargando" ? screen.getByRole("status").getAttribute("aria-label") : screen.getByRole("heading").textContent;
      expect(nombre?.length).toBeGreaterThan(3);
      unmount();
    }
  });
});
