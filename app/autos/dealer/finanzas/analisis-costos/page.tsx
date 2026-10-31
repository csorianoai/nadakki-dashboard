"use client";

/** Analisis de Costos: por vehiculo, por tipo y por mes (lector F1). Moneda: la funcional del tenant. */

import { useState } from "react";
import { COST_TYPES, COSTS_CAPABILITY_KEYS } from "@/lib/dealer-management/vehicle-costs";
import { agrupar, fetchCostos, hrefVehiculo } from "../analisis";
import { AnalisisMarco } from "../AnalisisMarco";
import { BarrasAnalisis } from "../BarrasAnalisis";

const etiquetaTipo = (t: string) => COST_TYPES.find((c) => c.value === t)?.label ?? t;

export default function AnalisisCostosPage() {
  const [tipo, setTipo] = useState<string | null>(null);
  return (
    <AnalisisMarco
      titulo="Análisis de costos"
      descripcion="Costos de las unidades por vehículo, tipo y mes. Pulsa una barra para ver el detalle."
      claves={COSTS_CAPABILITY_KEYS}
      cargar={fetchCostos}
    >
      {(datos, { formato }) => {
        // Solo la moneda funcional: otras monedas no se suman con ella.
        const propias = datos.filas.filter((f) => f.currency === datos.moneda);
        const otras = datos.totalesPorMoneda.filter((t) => t.currency !== datos.moneda);
        const vista = tipo ? propias.filter((f) => f.cost_type === tipo) : propias;
        const alternar = (t: string) => setTipo((actual) => (actual === t ? null : t));
        return (
          <div className="space-y-4" data-testid="analisis-costos">
            {otras.length > 0 ? (
              <p data-testid="analisis-otras-monedas" className="text-sm text-nk-fg-muted">
                Hay costos en otras monedas que no se suman al total:{" "}
                {otras.map((t) => `${t.currency} ${t.total}`).join(", ")}.
              </p>
            ) : null}
            <BarrasAnalisis
              titulo="Por tipo de costo (pulsa para filtrar)"
              datos={agrupar(propias, (f) => f.cost_type)}
              formato={formato}
              etiqueta={etiquetaTipo}
              onElegir={alternar}
              elegida={tipo}
              testidFila="costos-tipo"
            />
            <BarrasAnalisis
              titulo={tipo ? `Por vehículo — ${etiquetaTipo(tipo)}` : "Por vehículo"}
              datos={agrupar(vista, (f) => f.vehicle_id)}
              formato={formato}
              href={hrefVehiculo}
              testidFila="costos-vehiculo"
              horizontal
            />
            <BarrasAnalisis
              titulo={tipo ? `Por mes — ${etiquetaTipo(tipo)}` : "Por mes"}
              datos={agrupar(vista, (f) => f.mes, "clave")}
              formato={formato}
              testidFila="costos-mes"
            />
          </div>
        );
      }}
    </AnalisisMarco>
  );
}
