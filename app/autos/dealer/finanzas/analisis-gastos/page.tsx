"use client";

/** Analisis de Gastos: por cuenta y por mes (lector F1). Moneda: la funcional del tenant. */

import { useState } from "react";
import { COSTS_CAPABILITY } from "@/lib/dealer-management/vehicle-costs";
import { agrupar, fetchGastos } from "../analisis";
import { AnalisisMarco } from "../AnalisisMarco";
import { BarrasAnalisis } from "../BarrasAnalisis";

const CLAVES = [COSTS_CAPABILITY];

export default function AnalisisGastosPage() {
  const [cuenta, setCuenta] = useState<string | null>(null);
  return (
    <AnalisisMarco
      titulo="Análisis de gastos"
      descripcion="Gastos por cuenta contable y por mes. Pulsa una cuenta para ver su evolución mensual."
      claves={CLAVES}
      cargar={fetchGastos}
    >
      {(datos, { formato }) => {
        const nombres = new Map(datos.filas.map((f) => [f.codigo, f.nombre]));
        const etiqueta = (c: string) => `${c} ${nombres.get(c) ?? ""}`.trim();
        const vista = cuenta ? datos.filas.filter((f) => f.codigo === cuenta) : datos.filas;
        return (
          <div className="space-y-4" data-testid="analisis-gastos">
            <BarrasAnalisis
              titulo="Por cuenta (pulsa para filtrar)"
              datos={agrupar(datos.filas, (f) => f.codigo)}
              formato={formato}
              etiqueta={etiqueta}
              onElegir={(c) => setCuenta((a) => (a === c ? null : c))}
              elegida={cuenta}
              testidFila="gastos-cuenta"
              horizontal
            />
            <BarrasAnalisis
              titulo={cuenta ? `Por mes — ${etiqueta(cuenta)}` : "Por mes"}
              datos={agrupar(vista, (f) => f.mes, "clave")}
              formato={formato}
              testidFila="gastos-mes"
            />
          </div>
        );
      }}
    </AnalisisMarco>
  );
}
