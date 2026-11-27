import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import * as api from "@/lib/legal/ayuda-api";
import { AsistenteAyuda } from "@/components/legal/ayuda/AsistenteAyuda";

jest.mock("next/navigation", () => ({ usePathname: () => "/legal" }));
jest.mock("@/hooks/useLegalCore", () => ({ useLegalEffectiveTenantId: () => ({ effectiveTenantId: "t1" }) }));

const estado = (nivel: api.NivelAyuda): api.EstadoAyuda => ({
  nivel, ia_disponible: true, sugerencias: ["¿Cuánto cuesta el Estudio Genio?", "¿Cómo agrego a otro abogado?"] });
const pasos: api.PrimerosPasos = {
  completados: 2, total: 5,
  siguiente: { clave: "documento", paso: "Subir un documento al expediente", hecho: false, enlace: "/legal/cases" },
  pasos: [],
};

beforeEach(() => {
  jest.spyOn(api, "leerEstado").mockResolvedValue(estado("guia"));
  jest.spyOn(api, "leerPrimerosPasos").mockResolvedValue(pasos);
});
afterEach(() => jest.restoreAllMocks());

describe("Asistente de ayuda de Legal", () => {
  it("se abre con el avance del despacho y las preguntas sugeridas", async () => {
    render(<AsistenteAyuda />);
    fireEvent.click(screen.getByTestId("legal-ayuda-abrir"));
    expect(await screen.findByText("Primeros pasos: 2 de 5")).toBeTruthy();
    expect(screen.getByRole("link", { name: "Subir un documento al expediente" }).getAttribute("href")).toBe("/legal/cases");
    expect(await screen.findByText("¿Cuánto cuesta el Estudio Genio?")).toBeTruthy();
    expect(screen.getByText("Le explico cómo usar cada pantalla del despacho.")).toBeTruthy();
  });

  it("en Premium o Ilimitado se presenta como agente de IA", async () => {
    jest.spyOn(api, "leerEstado").mockResolvedValue(estado("agente"));
    render(<AsistenteAyuda />);
    fireEvent.click(screen.getByTestId("legal-ayuda-abrir"));
    expect(await screen.findByText(/Agente de IA del despacho/)).toBeTruthy();
  });

  it("responde con la pantalla a la que ir y las preguntas relacionadas", async () => {
    const p = jest.spyOn(api, "preguntar").mockResolvedValue({
      respuesta: "En Expedientes pulse «Importar carpeta».", enlaces: ["/legal/cases"],
      relacionadas: ["Dentro de un expediente: Documentos"], nivel: "guia", modo: "guia" });
    render(<AsistenteAyuda />);
    fireEvent.click(screen.getByTestId("legal-ayuda-abrir"));
    fireEvent.change(screen.getByLabelText("Escriba su pregunta…"), { target: { value: "como importo mis casos" } });
    fireEvent.click(screen.getByRole("button", { name: "Enviar" }));
    expect(await screen.findByText("En Expedientes pulse «Importar carpeta».")).toBeTruthy();
    expect(p).toHaveBeenCalledWith("t1", "como importo mis casos");
    expect(screen.getByRole("link", { name: "Ir a Expedientes" }).getAttribute("href")).toBe("/legal/cases");
    fireEvent.click(screen.getByRole("button", { name: "Dentro de un expediente: Documentos" }));
    await waitFor(() => expect(p).toHaveBeenCalledTimes(2));
  });

  it("si falla dice que intente de nuevo, sin romper el chat", async () => {
    jest.spyOn(api, "preguntar").mockRejectedValue(new Error("503"));
    render(<AsistenteAyuda />);
    fireEvent.click(screen.getByTestId("legal-ayuda-abrir"));
    fireEvent.click(await screen.findByText("¿Cómo agrego a otro abogado?"));
    expect(await screen.findByText("No pude responder ahora. Intente de nuevo en un momento.")).toBeTruthy();
    expect(screen.getByLabelText("Escriba su pregunta…")).toBeTruthy();
  });

  it("se cierra con Escape y no muestra enlaces fuera de la lista", async () => {
    expect(api.enlacesValidos(["/legal/cases", "/admin", 3, "/legal/inventado"])).toEqual(["/legal/cases"]);
    render(<AsistenteAyuda />);
    fireEvent.click(screen.getByTestId("legal-ayuda-abrir"));
    await screen.findByText("Primeros pasos: 2 de 5");
    fireEvent.keyDown(window, { key: "Escape" });
    expect(screen.queryByTestId("legal-ayuda")).toBeNull();
  });
});

describe("Texto de las respuestas del asistente", () => {
  it("muestra negritas y tablas sin asteriscos ni barras", async () => {
    const { TextoAyuda } = await import("@/components/legal/ayuda/TextoAyuda");
    const { render, screen } = await import("@testing-library/react");
    const { container } = render(<TextoAyuda texto={"Paquetes:\n- **Esencial:** US$500\n\n| Membresía | Precio |\n|---|---|\n| Premium | US$449 |\nFin"} />);
    expect(screen.getByText("Esencial:").tagName).toBe("STRONG");
    expect(screen.getByRole("columnheader", { name: "Membresía" })).toBeInTheDocument();
    expect(screen.getByRole("cell", { name: "US$449" })).toBeInTheDocument();
    expect(container.textContent).not.toMatch(/\*\*|\|/);
    expect(container.textContent).toContain("Fin");
  });
});
