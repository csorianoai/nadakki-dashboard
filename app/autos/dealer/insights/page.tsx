"use client";

import { Lightbulb } from "lucide-react";
import { DCC_CLASSES } from "@/components/dcc/clases";
import { DccPage } from "@/components/dcc/DccPage";
import { DccSeccion } from "@/components/dcc/DccSeccion";
import { SelloCalidad } from "@/components/dcc/SelloCalidad";

/**
 * Insights del dealer: el backend no expone la ruta que consumia esta pantalla
 * (`/api/v1/autos_ai/dealer_ai/insights`), asi que siempre caia en datos de
 * ejemplo. Hasta que exista, se muestra "Próximamente" y ninguna cifra.
 */
export default function DealerInsightsPage() {
  return (
    <DccPage titulo="Insights">
      <DccSeccion titulo="Recomendaciones para tu concesionario" icono={Lightbulb} testId="dcc-seccion-insights">
        <div className="flex flex-wrap items-center gap-3">
          <p className={`text-sm ${DCC_CLASSES.muted}`}>Estamos preparando esta sección con los datos reales de tu concesionario.</p>
          <SelloCalidad calidad={{ estado: "no_disponible", motivo: "Todavía no disponible para tu concesionario" }} />
        </div>
      </DccSeccion>
    </DccPage>
  );
}
