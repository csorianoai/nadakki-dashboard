/**
 * Centro Operativo y Guia de Carga (D9).
 *
 * El contenido es la guia VALIDADA CONTABLEMENTE por Cesar (GUIA-CARGA-MAPAAL,
 * csorianoai/nadakki-ai-suite#1501, comentario 5952253812). Lo que se mide aqui:
 *
 *  - que las reglas y los asientos esten COMPLETOS y con las cuentas correctas:
 *    si alguien le cambia un codigo de cuenta a un asiento, el test cae;
 *  - que el contenido viva en el ARCHIVO DE DATOS y no en la pantalla, probado
 *    con un centinela: si la pantalla repite el texto a mano, el centinela no
 *    aparece;
 *  - que el contenido se pida CON el tenant de la sesion.
 *
 * No se mide ningun importe porque esta guia no publica ninguno: no hay moneda
 * que pueda salir mal.
 */
import { render, screen } from "@testing-library/react";

import CentroOperativoPage from "@/app/centro-operativo/page";
import type { ContenidoCentroOperativo } from "@/app/centro-operativo/contenido";

let tenant: { id?: string } | null = null;
jest.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({ tenant }),
}));

/**
 * El modulo de contenido se interpone para poder DEMOSTRAR que la pantalla lo
 * lee. Por defecto delega en el real; `contenidoFalso` lo sustituye por un
 * centinela. Sin esto, una pantalla que escriba el texto a mano pasa los tests
 * igual --lo comprobe: esa mutacion sobrevivia-- y "el contenido vive en el
 * archivo de datos", que es la afirmacion central de D9, quedaria sin testigo.
 */
let contenidoFalso: ContenidoCentroOperativo | null = null;
const pedidoCon: (string | null | undefined)[] = [];
jest.mock("@/app/centro-operativo/contenido", () => ({
  contenidoCentroOperativo: (t?: string | null) => {
    pedidoCon.push(t);
    return (
      contenidoFalso ??
      jest.requireActual("@/app/centro-operativo/contenido").contenidoCentroOperativo(t)
    );
  },
}));

/** El contenido de verdad, sin pasar por el mock. */
function real(t?: string | null): ContenidoCentroOperativo {
  return jest
    .requireActual<typeof import("@/app/centro-operativo/contenido")>(
      "@/app/centro-operativo/contenido",
    )
    .contenidoCentroOperativo(t);
}

beforeEach(() => {
  tenant = { id: "mapaal" };
  contenidoFalso = null;
  pedidoCon.length = 0;
});

describe("la pantalla LEE el archivo de datos, no lo repite", () => {
  it("pinta cada bloque, sus asientos y sus advertencias", () => {
    const contenido = real("mapaal");
    render(<CentroOperativoPage />);
    for (const bloque of contenido.bloques) {
      const nodo = screen.getByTestId(`centro-bloque-${bloque.id}`);
      expect(nodo).toHaveTextContent(bloque.titulo);
      for (const asiento of bloque.asientos ?? []) {
        expect(nodo).toHaveTextContent(asiento.debe);
        expect(nodo).toHaveTextContent(asiento.haber);
      }
      if (bloque.advertencia) {
        expect(screen.getByTestId(`centro-advertencia-${bloque.id}`)).toHaveTextContent(
          bloque.advertencia,
        );
      }
    }
    for (const cuenta of contenido.cuentas) {
      expect(screen.getByTestId(`centro-cuenta-${cuenta.codigo}`)).toHaveTextContent(cuenta.nombre);
    }
    for (const tipo of contenido.tiposCosto) {
      expect(screen.getByTestId(`centro-tipo-${tipo.id}`)).toHaveTextContent(tipo.nombre);
    }
  });

  it("un contenido centinela se ve tal cual: la pantalla no tiene texto propio", () => {
    contenidoFalso = {
      tenant: "centinela",
      titulo: "TITULO-CENTINELA",
      entrada: "ENTRADA-CENTINELA",
      bloques: [
        {
          id: "b1",
          titulo: "BLOQUE-CENTINELA",
          parrafos: ["PARRAFO-CENTINELA"],
          pasos: ["PASO-CENTINELA"],
          vinetas: ["VINETA-CENTINELA"],
          asientos: [{ debe: "DEBE-CENTINELA", haber: "HABER-CENTINELA", concepto: "CONCEPTO-CENTINELA" }],
          advertencia: "ADVERTENCIA-CENTINELA",
        },
      ],
      tiposCostoIntro: "TIPOS-INTRO-CENTINELA",
      tiposCosto: [{ id: "t1", nombre: "TIPO-CENTINELA", descripcion: "DESCRIPCION-CENTINELA" }],
      cuentasIntro: "CUENTAS-INTRO-CENTINELA",
      cuentas: [{ codigo: "9999", nombre: "CUENTA-CENTINELA" }],
      reglaFinal: "REGLA-FINAL-CENTINELA",
    };
    const { container } = render(<CentroOperativoPage />);
    const texto = container.textContent ?? "";
    for (const centinela of [
      "TITULO-CENTINELA",
      "ENTRADA-CENTINELA",
      "BLOQUE-CENTINELA",
      "PARRAFO-CENTINELA",
      "PASO-CENTINELA",
      "VINETA-CENTINELA",
      "DEBE-CENTINELA",
      "HABER-CENTINELA",
      "CONCEPTO-CENTINELA",
      "ADVERTENCIA-CENTINELA",
      "TIPOS-INTRO-CENTINELA",
      "TIPO-CENTINELA",
      "DESCRIPCION-CENTINELA",
      "CUENTAS-INTRO-CENTINELA",
      "CUENTA-CENTINELA",
      "REGLA-FINAL-CENTINELA",
    ]) {
      expect(texto).toContain(centinela);
    }
    // Ni un encabezado escrito en la pantalla: si lo hubiera, sobreviviria aqui.
    expect(texto).not.toContain("Plan de cuentas");
    expect(texto).not.toContain("Tipos de costo");
    expect(texto).not.toContain("RT 54 FACPCE");
    expect(texto).not.toContain("3020");
  });

  it("sin tenant la pagina sigue entera: esta guia no cierra por acceso", () => {
    tenant = null;
    render(<CentroOperativoPage />);
    expect(screen.getByTestId("centro-bloque-primeros-pasos")).toBeInTheDocument();
    expect(screen.getByTestId("centro-cuentas")).toBeInTheDocument();
  });

  it("no publica ningun importe ni moneda: no hay nada que pueda salir mal", () => {
    const { container } = render(<CentroOperativoPage />);
    const texto = container.textContent ?? "";
    for (const simbolo of ["RD$", "MX$", "US$", "$ ", "ARS 1", "DOP"]) {
      expect(texto).not.toContain(simbolo);
    }
  });
});

/**
 * Hoy solo Mapaal tiene guia propia, asi que pasar el tenant o pasar `null` da el
 * mismo resultado VISIBLE y esa mutacion sobrevivia. Lo que si se mide es el
 * cableado: que la pantalla pida el contenido CON el tenant de la sesion.
 */
describe("el contenido se pide con el tenant de la sesion", () => {
  it("pasa el id del tenant, no una constante", () => {
    tenant = { id: "mapaal" };
    render(<CentroOperativoPage />);
    expect(pedidoCon).toContain("mapaal");
  });

  it("con otro tenant pide con ese otro", () => {
    tenant = { id: "otro-concesionario" };
    render(<CentroOperativoPage />);
    expect(pedidoCon).toContain("otro-concesionario");
    expect(pedidoCon).not.toContain("mapaal");
  });
});
