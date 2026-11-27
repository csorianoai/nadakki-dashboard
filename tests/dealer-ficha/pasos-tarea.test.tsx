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

test("cada paso pendiente con enlace se puede tocar; los hechos y los que no tienen enlace, no", () => {
  const varios: PasoTarea[] = [
    { id: "datos", titulo: "Cargar los datos", hecho: true, enlace: "/hecho" },
    { id: "compra", titulo: "Registrar la compra", hecho: false, enlace: "/registrar" },
    { id: "fotos", titulo: "Subir fotos", hecho: false, enlace: "#fotos" },
    { id: "precio", titulo: "Poner el precio", hecho: false },
  ];
  render(<PasosDeTarea titulo="Cargar un auto" pasos={varios} />);
  // El siguiente sigue teniendo su boton, y ademas su titulo enlaza.
  expect(screen.getByRole("link", { name: "Siguiente paso: Registrar la compra" })).toHaveAttribute("href", "/registrar");
  expect(screen.getByRole("link", { name: "Registrar la compra" })).toHaveAttribute("href", "/registrar");
  // Un paso pendiente que no es el siguiente tambien enlaza, con 44px de alto tocable.
  const fotos = screen.getByRole("link", { name: "Subir fotos" });
  expect(fotos).toHaveAttribute("href", "#fotos");
  expect(fotos.className).toContain("min-h-11");
  // Hecho con enlace: sin enlace. Pendiente sin enlace: texto.
  expect(screen.queryByRole("link", { name: "Cargar los datos" })).toBeNull();
  expect(screen.queryByTestId("paso-enlace-datos")).toBeNull();
  expect(screen.queryByRole("link", { name: "Poner el precio" })).toBeNull();
  expect(screen.getAllByRole("link")).toHaveLength(3);
});
