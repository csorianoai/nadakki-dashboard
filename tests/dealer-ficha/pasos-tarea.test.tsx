import { fireEvent, render, screen } from "@testing-library/react";
import { EVENTO_PROGRESO, PasosDeTarea, avisarProgreso, resumenPasos, type PasoTarea } from "@/lib/dealer/pasos-tarea";

const pasos: PasoTarea[] = [
  { id: "datos", titulo: "Cargar los datos", hecho: true },
  { id: "compra", titulo: "Registrar la compra", hecho: false, enlace: "/autos/dealer/inventario/v1/registrar", ayuda: "Proveedor y precio" },
  { id: "comision", titulo: "Comision", hecho: false, opcional: true },
];

test("cuenta solo los pasos que aplican y marca el siguiente con su enlace", () => {
  expect(resumenPasos(pasos)).toMatchObject({ hechos: 1, total: 2, siguiente: { id: "compra" } });
  render(<PasosDeTarea titulo="Cargar un auto" pasos={pasos} />);
  expect(screen.getByRole("heading")).toHaveTextContent("Cargar un auto: 1 de 2");
  expect(screen.getByRole("link", { name: "Siguiente paso: Registrar la compra" })).toHaveAttribute(
    "href", "/autos/dealer/inventario/v1/registrar");
  expect(screen.getByText("Proveedor y precio")).toBeInTheDocument();
  expect(screen.getByTestId("paso-comision")).toHaveTextContent("(opcional)");
});

test("sin enlace dice que el paso es en esta pantalla y al terminar muestra el cierre", () => {
  const { rerender } = render(<PasosDeTarea titulo="Vender" pasos={[{ id: "a", titulo: "Elegir comprador", hecho: false }]} />);
  expect(screen.getByTestId("paso-siguiente-aqui")).toHaveTextContent("Elegir comprador, en esta pantalla");
  rerender(<PasosDeTarea titulo="Vender" pasos={[{ id: "a", titulo: "Elegir comprador", hecho: true }]} final="Venta registrada." />);
  expect(screen.getByTestId("pasos-completos")).toHaveTextContent("Venta registrada.");
});

test("avisarProgreso emite el evento que escucha la bienvenida", () => {
  const visto: string[] = [];
  const oir = (e: Event) => visto.push((e as CustomEvent).detail.motivo);
  window.addEventListener(EVENTO_PROGRESO, oir);
  avisarProgreso("auto_creado");
  fireEvent(window, new Event("otro"));
  window.removeEventListener(EVENTO_PROGRESO, oir);
  expect(visto).toEqual(["auto_creado"]);
});
