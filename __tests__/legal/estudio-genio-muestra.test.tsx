import fs from "fs";
import path from "path";
import { render, screen } from "@testing-library/react";
import { MuestraGenio, RUTA_MUESTRA } from "@/components/legal/cases/estudio-genio/MuestraGenio";

describe("Estudio Genio: informe de muestra", () => {
  test("enlaza al PDF de muestra y explica qué recibe el abogado", () => {
    render(<MuestraGenio />);
    const enlace = screen.getByRole("link", { name: /informe de muestra/i });
    expect(enlace).toHaveAttribute("href", RUTA_MUESTRA);
    expect(enlace).toHaveAttribute("target", "_blank");
    expect(screen.getByRole("heading", { name: "Qué recibe" })).toBeInTheDocument();
    expect(screen.getAllByRole("listitem")).toHaveLength(9);
    expect(screen.getByText(/no sustituye al abogado/i)).toBeInTheDocument();
  });

  test("el PDF y la portada existen en public y el PDF no es la versión con errores", () => {
    const pub = path.resolve(__dirname, "../../public");
    const pdf = path.join(pub, RUTA_MUESTRA);
    expect(fs.existsSync(pdf)).toBe(true);
    expect(fs.statSync(pdf).size).toBeGreaterThan(500_000);
    expect(fs.existsSync(path.join(pub, "muestras/estudio-genio-dossier-muestra-portada.webp"))).toBe(true);
  });
});
