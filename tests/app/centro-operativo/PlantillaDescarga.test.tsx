/** @jest-environment jsdom */

/**
 * La plantilla se DESCARGA con su nombre (auditoria Mapaal QA): antes el .xlsx
 * se abria en el navegador. `download` lleva el nombre del fichero y el clic lo
 * baja como blob con ese nombre; si el fetch falla, se sigue el enlace.
 */
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import {
  PlantillaDescarga,
  descargarPlantilla,
  nombreDePlantilla,
} from "@/components/dealer-management/PlantillaDescarga";
import { plantillaDeCarga, type PlantillaCarga } from "@/app/centro-operativo/contenido";

const PLANTILLA: PlantillaCarga = {
  ruta: "/assets/centro-operativo/Plantilla_Activos_Mapaal_v4.xlsx",
  version: "v4",
  etiqueta: "Descargar plantilla de carga (Excel)",
  descripcion: "Para qué sirve.",
};

const fetchMock = jest.fn();
const crear = jest.fn(() => "blob:plantilla");
const revocar = jest.fn();
let clics: HTMLAnchorElement[] = [];

beforeEach(() => {
  fetchMock.mockReset();
  crear.mockClear();
  revocar.mockClear();
  clics = [];
  Object.assign(global, { fetch: fetchMock });
  Object.assign(URL, { createObjectURL: crear, revokeObjectURL: revocar });
  jest.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(function (this: HTMLAnchorElement) {
    clics.push(this);
  });
});

afterEach(() => {
  jest.useRealTimers();
  jest.restoreAllMocks();
});

function ok() {
  return { ok: true, blob: async () => new Blob(["PK"]) } as unknown as Response;
}

describe("nombreDePlantilla", () => {
  it("es el ultimo tramo de la ruta, sin query ni ancla", () => {
    expect(nombreDePlantilla(PLANTILLA.ruta)).toBe("Plantilla_Activos_Mapaal_v4.xlsx");
    expect(nombreDePlantilla("/a/b/p-v9.xlsx?x=1#y")).toBe("p-v9.xlsx");
    expect(nombreDePlantilla("/")).toBe("plantilla.xlsx");
  });

  it("la plantilla real de Mapaal se guarda como Plantilla_Activos_Mapaal_v4.xlsx", () => {
    expect(nombreDePlantilla(plantillaDeCarga("mapaal")!.ruta)).toBe("Plantilla_Activos_Mapaal_v4.xlsx");
  });
});

describe("el boton", () => {
  it("lleva `download` con el nombre del fichero y conserva el href", () => {
    render(<PlantillaDescarga plantilla={PLANTILLA} testId="boton" />);
    const boton = screen.getByTestId("boton");
    expect(boton).toHaveAttribute("download", "Plantilla_Activos_Mapaal_v4.xlsx");
    expect(boton).toHaveAttribute("href", PLANTILLA.ruta);
  });

  it("el clic baja el fichero como blob y lo guarda con su nombre", async () => {
    fetchMock.mockResolvedValue(ok());
    render(<PlantillaDescarga plantilla={PLANTILLA} testId="boton" />);
    const evento = new MouseEvent("click", { bubbles: true, cancelable: true, button: 0 });
    fireEvent(screen.getByTestId("boton"), evento);
    expect(evento.defaultPrevented).toBe(true);
    await waitFor(() => expect(clics).toHaveLength(1));
    expect(fetchMock).toHaveBeenCalledWith(PLANTILLA.ruta);
    expect(clics[0].download).toBe("Plantilla_Activos_Mapaal_v4.xlsx");
    expect(clics[0].getAttribute("href")).toBe("blob:plantilla");
    await waitFor(() => expect(revocar).toHaveBeenCalledWith("blob:plantilla"), { timeout: 2000 });
  });

  it("con Ctrl/Cmd el navegador hace lo suyo", () => {
    render(<PlantillaDescarga plantilla={PLANTILLA} testId="boton" />);
    const evento = new MouseEvent("click", { bubbles: true, cancelable: true, button: 0, ctrlKey: true });
    fireEvent(screen.getByTestId("boton"), evento);
    expect(evento.defaultPrevented).toBe(false);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe("descargarPlantilla", () => {
  it("una respuesta no 2xx no se guarda: devuelve false y el boton sigue el enlace", async () => {
    fetchMock.mockResolvedValue({ ok: false, status: 404 } as Response);
    await expect(descargarPlantilla(PLANTILLA.ruta, "p.xlsx")).resolves.toBe(false);
    expect(crear).not.toHaveBeenCalled();
    expect(clics).toHaveLength(0);
  });
});
