/**
 * PROTOTIPO — genera el HTML estatico del kit con fixtures deterministas para las capturas de evidencia.
 * Solo escribe si ANALYTICS_HARNESS_OUT esta definido (ver e2e/analytics/build-harness.sh); si no, se omite.
 * No es una pantalla de produccion ni importa nada fuera del kit y de los fixtures.
 */
import { mkdirSync, writeFileSync } from "fs";
import { join } from "path";
import { renderToStaticMarkup } from "react-dom/server";
import { BarraFiltros, CifraKpiCard, EstadoAnalitica, GrillaKpi, SelectorPeriodo } from "@/components/analytics/kit";
import * as F from "../fixtures/cifras.fixture";

const OUT = process.env.ANALYTICS_HARNESS_OUT;
const run = OUT ? it : it.skip;

function Pagina() {
  return (
    <div className="forge-app min-h-screen bg-forgeSurface-sunken p-4 sm:p-6" data-theme="light">
      <div data-testid="banner-prototipo" role="note" className="mb-4 rounded-forge-sm border border-forgeGray-200 bg-forgeGray-50 px-3 py-2 text-forge-xs font-medium text-forgeGray-700">
        PROTOTIPO — datos de ejemplo deterministas, no son cifras reales de ningún tenant.
      </div>
      <h1 className="mb-4 font-display text-forge-lg font-semibold text-forgeGray-800">Kit de analítica · Ola 0 · PR 1</h1>
      <div className="mb-4 space-y-4">
        <SelectorPeriodo valor={{ tipo: "30d" }} onChange={() => {}} />
        <BarraFiltros
          onChange={() => {}}
          filtros={[
            { id: "canal", etiqueta: "Canal", valor: "todos", opciones: [{ valor: "todos", etiqueta: "Todos" }, { valor: "ads", etiqueta: "Google Ads" }] },
            { id: "campana", etiqueta: "Campaña", valor: "todos", opciones: [{ valor: "todos", etiqueta: "Todas" }] },
          ]}
        />
      </div>
      <GrillaKpi>
        <CifraKpiCard cifra={F.CIFRA_SUBE} />
        <CifraKpiCard cifra={F.CIFRA_BAJA} />
        <CifraKpiCard cifra={F.CIFRA_COSTO_SUBE} />
        <CifraKpiCard cifra={F.CIFRA_ANTERIOR_CERO} />
        <CifraKpiCard cifra={F.CIFRA_SIN_FUENTE} />
        <CifraKpiCard cifra={{ ...F.CIFRA_SUBE, id: "cargando", estado: "cargando" }} />
        <CifraKpiCard cifra={{ ...F.CIFRA_SUBE, id: "error", estado: "error" }} />
        <CifraKpiCard cifra={{ ...F.CIFRA_SUBE, id: "vacio", estado: "vacio" }} />
      </GrillaKpi>
      <div className="mt-4">
        <EstadoAnalitica estado="datos_insuficientes" />
      </div>
    </div>
  );
}

describe("harness del kit", () => {
  run("escribe kit.html", () => {
    mkdirSync(OUT as string, { recursive: true });
    const html = `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Kit analitica (PROTOTIPO)</title><link rel="stylesheet" href="kit.css"></head><body>${renderToStaticMarkup(<Pagina />)}</body></html>`;
    writeFileSync(join(OUT as string, "kit.html"), html);
    expect(html).toContain("PROTOTIPO");
  });
});
