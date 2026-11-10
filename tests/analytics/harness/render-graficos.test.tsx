/**
 * PROTOTIPO — genera el HTML estatico de los graficos con fixtures deterministas para las capturas de evidencia.
 * Solo escribe si ANALYTICS_HARNESS_OUT esta definido (ver e2e/analytics/build-harness.sh); si no, se omite.
 * Escribe un archivo por viewport porque los graficos dibujan a su ancho real (el harness fija ese ancho).
 * No es una pantalla de produccion ni importa nada fuera del kit y de los fixtures.
 */
import { mkdirSync, writeFileSync } from "fs";
import { join } from "path";
import type { ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { Barras, Dispersion, Donut, Embudo, SerieTemporal } from "@/components/analytics/kit";
import { CATEGORIAS, ETAPAS, META_OK, PUNTOS, SERIE_ACTUAL, SERIE_ANTERIOR } from "../fixtures/graficos.fixture";

const OUT = process.env.ANALYTICS_HARNESS_OUT;
const run = OUT ? it : it.skip;

const VIEWPORTS = [
  { nombre: "1440x900", ancho: 660 },
  { nombre: "390x844", ancho: 326 },
  { nombre: "320x568", ancho: 256 },
] as const;

const SERIE_LARGA = Array.from({ length: 30 }, (_, i) => ({ x: `2026-10-${String(i + 1).padStart(2, "0")}`, y: 40 + ((i * 7) % 23) + i }));
const SERIE_LARGA_ANT = SERIE_LARGA.map((p, i) => ({ x: `2026-09-${String(i + 1).padStart(2, "0")}`, y: 35 + ((i * 5) % 19) }));

function Seccion({ id, children }: { id: string; children: ReactNode }) {
  return (
    <section data-testid={id} className="min-w-0">
      {children}
    </section>
  );
}

function Pagina({ ancho }: { ancho: number }) {
  const m = (titulo: string) => ({ ...META_OK, titulo });
  return (
    <div className="forge-app min-h-screen bg-forgeSurface-sunken p-4 sm:p-6" data-theme="light">
      <div data-testid="banner-prototipo" role="note" className="mb-4 rounded-forge-sm border border-forgeGray-200 bg-forgeGray-50 px-3 py-2 text-forge-xs font-medium text-forgeGray-700">
        PROTOTIPO — datos de ejemplo deterministas, no son cifras reales de ningún tenant.
      </div>
      <h1 className="mb-4 font-display text-forge-lg font-semibold text-forgeGray-800">Kit de analítica · Ola 0 · PR 2 · gráficos</h1>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Seccion id="c-serie">
          <SerieTemporal meta={m("Leads por día (30 días)")} datos={{ actual: SERIE_LARGA, anterior: SERIE_LARGA_ANT }} unidad="numero" ancho={ancho} />
        </Seccion>
        <Seccion id="c-serie-corta">
          <SerieTemporal meta={m("Costo por lead (5 días)")} datos={{ actual: SERIE_ACTUAL, anterior: SERIE_ANTERIOR }} unidad="moneda" moneda="USD" ancho={ancho} />
        </Seccion>
        <Seccion id="c-barras-h">
          <Barras meta={m("Leads por canal")} datos={CATEGORIAS} unidad="numero" ancho={ancho} />
        </Seccion>
        <Seccion id="c-barras-v">
          <Barras meta={m("Leads por canal (vertical)")} datos={CATEGORIAS.slice(0, 5)} unidad="numero" orientacion="vertical" ancho={ancho} />
        </Seccion>
        <Seccion id="c-donut">
          <Donut meta={m("Fuentes de leads")} datos={CATEGORIAS} maxCategorias={4} unidad="numero" />
        </Seccion>
        <Seccion id="c-embudo">
          <Embudo meta={m("Embudo de ventas")} etapas={ETAPAS} />
        </Seccion>
        <Seccion id="c-dispersion">
          <Dispersion meta={m("Impresiones vs CTR por campaña")} puntos={PUNTOS} ejeX={{ etiqueta: "Impresiones", unidad: "numero" }} ejeY={{ etiqueta: "CTR", unidad: "porcentaje" }} ancho={ancho} />
        </Seccion>
        <Seccion id="c-estados">
          <div className="grid grid-cols-1 gap-4">
            <Barras meta={{ ...m("Sin datos en el periodo"), }} datos={[]} unidad="numero" />
            <Embudo meta={{ ...m("Embudo con una etapa en cero"), }} etapas={[{ etiqueta: "Contacto", valor: 0 }, { etiqueta: "Cualificado", valor: 5 }, { etiqueta: "Visita", valor: 2 }]} />
            <Donut meta={{ ...m("Fuente aún no conectada"), fuente: null }} datos={CATEGORIAS} unidad="numero" />
            <SerieTemporal meta={{ ...m("Error de carga"), estado: "error" }} datos={{ actual: SERIE_ACTUAL }} unidad="numero" />
          </div>
        </Seccion>
      </div>
    </div>
  );
}

describe("harness de graficos", () => {
  run("escribe graficos-<viewport>.html", () => {
    mkdirSync(OUT as string, { recursive: true });
    for (const v of VIEWPORTS) {
      const html = `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Graficos del kit (PROTOTIPO)</title><link rel="stylesheet" href="kit.css"></head><body>${renderToStaticMarkup(<Pagina ancho={v.ancho} />)}</body></html>`;
      writeFileSync(join(OUT as string, `graficos-${v.nombre}.html`), html);
      expect(html).toContain("PROTOTIPO");
    }
  });
});
