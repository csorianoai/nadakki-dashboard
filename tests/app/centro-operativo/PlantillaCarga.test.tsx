/** @jest-environment jsdom */

/**
 * El boton "Descargar plantilla de carga (Excel)" (D9).
 *
 * Lo que se protege:
 *
 *  1. La RUTA, la version, la etiqueta y la linea que explica para que sirve
 *     salen del ARCHIVO DE DATOS. La pantalla no escribe ninguna: cambiar de
 *     version (v3 -> v4) tiene que ser cambiar una linea de datos, sin tocar
 *     codigo. El test lo comprueba inyectando un bloque y leyendo lo pintado.
 *  2. Si el bloque NO declara plantilla, no se pinta nada. Un boton de descarga
 *     que apunta a un fichero no desplegado es peor que no tener boton.
 *  3. El enlace lleva `download`, para que el navegador guarde el .xlsx en vez
 *     de intentar abrir un binario en una pestana.
 *
 * Estado del asset, medido el 2026-10-02: el .xlsx oficial NO existe todavia
 * --ni en este repo ni en nadakki-ai-suite-- y en suite#1501 no hay artefacto
 * de P5, asi que claude-b1 aun no ha confirmado si la oficial es v3 o v4. Por
 * eso el bloque de Mapaal deja la plantilla sin declarar y el ultimo test de
 * este fichero FIJA ese estado: cuando se declare, ese test avisa y hay que
 * cambiarlo a la expectativa contraria.
 */

import { render, screen } from "@testing-library/react";
import CentroOperativoPage from "@/app/centro-operativo/page";
import {
  contenidoCentroOperativo,
  type ContenidoCentroOperativo,
  type PlantillaCarga,
} from "@/app/centro-operativo/contenido";

jest.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({ tenant: { id: "mapaal", display_name: "Mapaal" } }),
}));

const PLANTILLA: PlantillaCarga = {
  ruta: "/assets/centro-operativo/plantilla-carga-test-v9.xlsx",
  version: "v9",
  etiqueta: "Descargar plantilla de carga (Excel)",
  descripcion: "Para qué sirve, dicho en una línea.",
};

/** Contenido minimo con un bloque que declara plantilla. */
function conPlantilla(plantilla?: PlantillaCarga): ContenidoCentroOperativo {
  return {
    tenant: "mapaal",
    titulo: "Guía",
    entrada: "Entrada",
    bloques: [
      {
        id: "primeros-pasos",
        titulo: "Primeros pasos",
        pasos: ["Cargá el stock existente."],
        ...(plantilla ? { plantilla } : {}),
      },
    ],
    tiposCostoIntro: "Tipos",
    tiposCosto: [],
    cuentasIntro: "Cuentas",
    cuentas: [],
    reglaFinal: "Regla",
  };
}

jest.mock("@/app/centro-operativo/contenido", () => {
  const real = jest.requireActual("@/app/centro-operativo/contenido");
  return { ...real, contenidoCentroOperativo: jest.fn(real.contenidoCentroOperativo) };
});

const contenidoMock = contenidoCentroOperativo as jest.MockedFunction<
  typeof contenidoCentroOperativo
>;

describe("el boton de la plantilla se pinta desde el archivo de datos", () => {
  afterEach(() => jest.clearAllMocks());

  test("la ruta, la version y los textos son los de los datos", () => {
    contenidoMock.mockReturnValue(conPlantilla(PLANTILLA));

    render(<CentroOperativoPage />);

    const boton = screen.getByTestId("centro-plantilla-descargar");
    expect(boton).toHaveAttribute("href", PLANTILLA.ruta);
    expect(boton).toHaveAttribute("data-version", "v9");
    expect(boton).toHaveTextContent(PLANTILLA.etiqueta);
    // La linea que explica para que sirve.
    expect(screen.getByText(PLANTILLA.descripcion)).toBeInTheDocument();
  });

  test("lleva `download`, para que se guarde en vez de abrirse", () => {
    contenidoMock.mockReturnValue(conPlantilla(PLANTILLA));

    render(<CentroOperativoPage />);

    expect(screen.getByTestId("centro-plantilla-descargar")).toHaveAttribute("download");
  });

  test("cuelga del bloque de primeros pasos, que es donde lo pide Cesar", () => {
    contenidoMock.mockReturnValue(conPlantilla(PLANTILLA));

    render(<CentroOperativoPage />);

    const zona = screen.getByTestId("centro-plantilla-primeros-pasos");
    expect(zona).toContainElement(screen.getByTestId("centro-plantilla-descargar"));
  });

  test("cambiar de version es cambiar los datos, no el codigo", () => {
    contenidoMock.mockReturnValue(
      conPlantilla({
        ...PLANTILLA,
        ruta: "/assets/centro-operativo/plantilla-carga-test-v3.xlsx",
        version: "v3",
      }),
    );

    render(<CentroOperativoPage />);

    const boton = screen.getByTestId("centro-plantilla-descargar");
    expect(boton).toHaveAttribute("href", "/assets/centro-operativo/plantilla-carga-test-v3.xlsx");
    expect(boton).toHaveAttribute("data-version", "v3");
  });

  test("sin plantilla declarada no se pinta ningun boton", () => {
    contenidoMock.mockReturnValue(conPlantilla(undefined));

    render(<CentroOperativoPage />);

    expect(screen.queryByTestId("centro-plantilla-descargar")).not.toBeInTheDocument();
    expect(screen.queryByTestId("centro-plantilla-primeros-pasos")).not.toBeInTheDocument();
  });
});

describe("el estado real del asset, para que no se declare una ruta muerta", () => {
  test("Mapaal todavia NO declara plantilla (pendiente de P5 / claude-b1)", () => {
    const real = jest.requireActual("@/app/centro-operativo/contenido");
    const bloque = real
      .contenidoCentroOperativo("mapaal")
      .bloques.find((b: { id: string }) => b.id === "primeros-pasos");

    expect(bloque).toBeDefined();
    // CUANDO LLEGUE EL .xlsx OFICIAL este test se pone en rojo. Es su trabajo:
    // avisa de que hay que invertirlo y comprobar que la ruta declarada existe
    // de verdad en `public/`.
    expect(bloque.plantilla).toBeUndefined();
  });
});
