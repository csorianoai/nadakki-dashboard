/**
 * PROTOTIPO — genera el HTML estatico de la tabla y del layout movil con fixtures deterministas para las capturas de evidencia.
 * Solo escribe si ANALYTICS_HARNESS_OUT esta definido (ver e2e/analytics/build-harness.sh); si no, se omite.
 * Escritorio y movil se renderizan con window.matchMedia simulado (el HTML resultante es estatico, sin JS).
 * No es una pantalla de produccion ni importa nada fuera del kit y de los fixtures.
 */
import { mkdirSync, writeFileSync } from "fs";
import { join } from "path";
import { render } from "@testing-library/react";
import { CifraKpiCard, GrillaKpi } from "@/components/analytics/kit";
import { SeccionesAnaliticas } from "@/components/analytics/kit/movil";
import { TablaAnalitica, type ColumnaAnalitica } from "@/components/analytics/kit/tabla";
import * as F from "../fixtures/cifras.fixture";
import { FILAS_CINCO, FILAS_VEINTICINCO, type FilaCampana } from "../fixtures/tabla.fixture";

const OUT = process.env.ANALYTICS_HARNESS_OUT;
const run = OUT ? it : it.skip;
/** Tema de la captura: ANALYTICS_HARNESS_TEMA=dark (azul noche) o light (por defecto). */
const TEMA = process.env.ANALYTICS_HARNESS_TEMA === "dark" ? "dark" : "light";

const COLUMNAS: ColumnaAnalitica<FilaCampana>[] = [
  { id: "nombre", encabezado: "Campaña", tipo: "texto", texto: (f) => f.nombre, filtrable: true },
  { id: "clics", encabezado: "Clics", tipo: "cifra", cifra: (f) => f.clics, calor: true, filtrable: true },
  { id: "ctr", encabezado: "CTR", tipo: "cifra", cifra: (f) => f.ctr, calor: true },
  { id: "costo", encabezado: "Costo", tipo: "cifra", cifra: (f) => f.costo },
];
const FILAS = [...FILAS_CINCO, ...FILAS_VEINTICINCO.slice(0, 10)];

function Pagina({ inicial }: { inicial?: string }) {
  return (
    <div className="forge-app kit-fondo min-h-screen p-4 sm:p-6" data-theme={TEMA}>
      <div data-testid="banner-prototipo" role="note" className="mb-4 rounded-forge-sm border kit-bd kit-bg-hundida px-3 py-2 text-forge-xs font-medium kit-txt-2">
        PROTOTIPO — datos de ejemplo deterministas, no son cifras reales de ningún tenant.
      </div>
      <h1 className="mb-4 font-display text-[length:var(--forge-text-lg,18px)] font-semibold kit-txt">Kit de analítica · Ola 0 · PR 3</h1>
      <SeccionesAnaliticas
        inicial={inicial}
        secciones={[
          {
            id: "resumen",
            titulo: "Resumen",
            contenido: (
              <GrillaKpi>
                <CifraKpiCard cifra={F.CIFRA_SUBE} />
                <CifraKpiCard cifra={F.CIFRA_COSTO_SUBE} />
                <CifraKpiCard cifra={F.CIFRA_ANTERIOR_CERO} />
              </GrillaKpi>
            ),
          },
          {
            id: "detalle",
            titulo: "Detalle",
            contenido: (
              <TablaAnalitica
                titulo="Campañas"
                columnas={COLUMNAS}
                filas={FILAS}
                obtenerId={(f) => f.id}
                ordenInicial={{ columna: "clics", direccion: "desc" }}
              />
            ),
          },
        ]}
      />
    </div>
  );
}

function conMatchMedia(movil: boolean) {
  const mql = { matches: movil, media: "", addEventListener: () => {}, removeEventListener: () => {} };
  Object.defineProperty(window, "matchMedia", { writable: true, configurable: true, value: () => mql });
}

function documento(cuerpo: string, titulo: string) {
  return `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${titulo} (PROTOTIPO)</title><link rel="stylesheet" href="kit.css"></head><body>${cuerpo}</body></html>`;
}

describe("harness de la tabla y del layout movil", () => {
  afterEach(() => {
    // @ts-expect-error limpieza del mock
    delete window.matchMedia;
  });
  run("escribe tabla-escritorio.html, tabla-movil.html y seccion-movil-resumen.html", () => {
    mkdirSync(OUT as string, { recursive: true });
    const casos = [
      { archivo: "tabla-escritorio.html", movil: false, inicial: undefined },
      { archivo: "tabla-movil.html", movil: true, inicial: "detalle" },
      { archivo: "seccion-movil-resumen.html", movil: true, inicial: undefined },
    ];
    for (const c of casos) {
      conMatchMedia(c.movil);
      const { container, unmount } = render(<Pagina inicial={c.inicial} />);
      const html = documento(container.innerHTML, c.archivo);
      writeFileSync(join(OUT as string, c.archivo), html);
      expect(html).toContain("PROTOTIPO");
      expect(html).not.toMatch(/NaN|Infinity/);
      unmount();
    }
  });
});
