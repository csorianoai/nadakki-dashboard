"use client";

/**
 * Resultados de Finanzas del inventario: totales del endpoint, graficos y tabla por unidad.
 * Los totales son `total` y `totales_por_moneda` tal como llegan; el navegador solo agrupa
 * para las barras y solo con costos de la moneda del endpoint.
 */

import Link from "next/link";
import { agrupar, hrefVehiculo } from "../analisis";
import { BarrasAnalisis } from "../BarrasAnalisis";
import { costoEnMoneda, etiquetaUnidad, type InventarioReporte, type UnidadFila } from "./inventario";

type Formato = (valor: number) => string;
const fecha = (iso: string) => iso.slice(0, 10) || "—";

export function Resultados({ datos, formato, formatoEn }: { datos: InventarioReporte; formato: Formato; formatoEn: (v: number, moneda: string) => string }) {
  const { filas, moneda } = datos;
  const nombres = new Map(filas.map((f) => [f.vehicle_id, etiquetaUnidad(f)]));
  const etiqueta = (id: string) => nombres.get(id) ?? "Unidad";
  const dias = (v: number) => `${v} d`;
  const conCosto = filas.flatMap((f) => {
    const c = costoEnMoneda(f, moneda);
    return c === null ? [] : [{ f, total: c }];
  });
  const conDias = filas.flatMap((f) => (f.dias_en_stock === null ? [] : [{ f, total: f.dias_en_stock }]));
  const conMargen = filas.flatMap((f) => (f.margen_esperado === null ? [] : [{ f, total: f.margen_esperado }]));
  const formatoPrecio = (f: UnidadFila, v: number) => (f.moneda_precio ? formatoEn(v, f.moneda_precio) : formato(v));
  const margenMoneda = new Set(conMargen.map((m) => m.f.moneda_precio || moneda)).size <= 1;

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-nk-border bg-nk-surface p-4 text-sm text-nk-fg">
        Costo neto del inventario ({moneda}):{" "}
        <strong data-testid="inv-total" data-total={datos.total} data-moneda={moneda} className="text-xl tabular-nums">
          {formato(datos.total)}
        </strong>
        {datos.totalesPorMoneda.length > 0 ? (
          <ul className="mt-2 flex flex-wrap gap-x-4 text-nk-fg-muted" aria-label="Totales por moneda">
            {datos.totalesPorMoneda.map((t) => (
              <li key={t.currency} data-testid={`inv-total-${t.currency}`} data-total={t.total} className="tabular-nums">
                {formatoEn(t.total, t.currency)}
              </li>
            ))}
          </ul>
        ) : null}
      </div>

      <BarrasAnalisis
        titulo="Costo por marca"
        datos={agrupar(conCosto, (r) => r.f.make || "Sin marca")}
        formato={formato}
        testidFila="inv-marca"
      />
      <BarrasAnalisis
        titulo="Costo por mes de adquisición"
        datos={agrupar(conCosto, (r) => r.f.acquired_at.slice(0, 7) || "Sin fecha", "clave")}
        formato={formato}
        testidFila="inv-mes"
      />
      <BarrasAnalisis
        titulo="Días en stock por unidad"
        datos={agrupar(conDias, (r) => r.f.vehicle_id)}
        formato={dias}
        etiqueta={etiqueta}
        href={hrefVehiculo}
        testidFila="inv-dias"
        horizontal
      />
      {conMargen.length > 0 && margenMoneda ? (
        <BarrasAnalisis
          titulo="Margen esperado por unidad"
          datos={agrupar(conMargen, (r) => r.f.vehicle_id)}
          formato={(v) => formatoEn(v, conMargen[0].f.moneda_precio || moneda)}
          etiqueta={etiqueta}
          href={hrefVehiculo}
          testidFila="inv-margen"
          horizontal
        />
      ) : null}

      <section aria-label="Unidades" className="max-w-full overflow-x-auto rounded-xl border border-nk-border bg-nk-surface p-4">
        <table data-testid="inv-tabla" className="w-full text-left text-sm text-nk-fg">
          <caption className="sr-only">Unidades del inventario con su costo neto</caption>
          <thead>
            <tr className="text-nk-fg-muted">
              <th scope="col" className="py-2 pr-3">Unidad</th>
              <th scope="col" className="pr-3">Estado</th>
              <th scope="col" className="pr-3">Adquirida</th>
              <th scope="col" className="pr-3 text-right">Días</th>
              <th scope="col" className="pr-3 text-right">Costo neto</th>
              {datos.hayMargen ? <th scope="col" className="pr-3 text-right">Precio de lista</th> : null}
              {datos.hayMargen ? <th scope="col" className="text-right">Margen esperado</th> : null}
            </tr>
          </thead>
          <tbody>
            {filas.map((f) => {
              const c = costoEnMoneda(f, moneda);
              return (
                <tr key={f.vehicle_id} data-testid="inv-fila" className="border-t border-nk-border">
                  <td className="py-2 pr-3">
                    <Link href={hrefVehiculo(f.vehicle_id)} className="font-semibold underline">
                      {etiquetaUnidad(f)}
                    </Link>
                  </td>
                  <td className="pr-3">{f.status || "—"}</td>
                  <td className="pr-3 tabular-nums">{fecha(f.acquired_at)}</td>
                  <td className="pr-3 text-right tabular-nums">{f.dias_en_stock ?? "—"}</td>
                  <td className="pr-3 text-right tabular-nums">{c === null ? "—" : formato(c)}</td>
                  {datos.hayMargen ? (
                    <td className="pr-3 text-right tabular-nums">{f.precio_lista === null ? "—" : formatoPrecio(f, f.precio_lista)}</td>
                  ) : null}
                  {datos.hayMargen ? (
                    <td className="text-right tabular-nums">{f.margen_esperado === null ? "—" : formatoPrecio(f, f.margen_esperado)}</td>
                  ) : null}
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="border-t border-nk-border font-semibold">
              <th scope="row" colSpan={4} className="py-2 text-left">Total del endpoint ({moneda})</th>
              <td className="pr-3 text-right tabular-nums">{formato(datos.total)}</td>
              {datos.hayMargen ? <td colSpan={2} /> : null}
            </tr>
          </tfoot>
        </table>
      </section>
    </div>
  );
}
