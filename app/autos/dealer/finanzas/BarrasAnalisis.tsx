"use client";

/**
 * Grafico de barras (recharts, ya en package.json) mas su tabla de detalle.
 *
 * La tabla es la fuente accesible del mismo dato: cada fila enlaza al detalle
 * (`href`) o, si no hay pantalla de detalle, se pulsa para filtrar (`onElegir`).
 * Pulsar una barra hace lo mismo que su fila.
 */

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { Barra } from "./analisis";

const COLOR = "#2563eb";
const COLOR_ELEGIDA = "#1e3a8a";
const COLOR_APAGADA = "#93c5fd";

export function BarrasAnalisis({
  titulo,
  datos,
  formato,
  etiqueta = (clave) => clave,
  href,
  onElegir,
  elegida,
  testidFila,
  horizontal = false,
}: {
  titulo: string;
  datos: Barra[];
  formato: (valor: number) => string;
  etiqueta?: (clave: string) => string;
  href?: (clave: string) => string;
  onElegir?: (clave: string) => void;
  elegida?: string | null;
  testidFila: string;
  horizontal?: boolean;
}) {
  const router = useRouter();
  const pulsar = (clave: string) => (href ? router.push(href(clave)) : onElegir?.(clave));
  const puntos = datos.map((d) => ({ ...d, nombre: etiqueta(d.clave) }));
  const alto = horizontal ? Math.max(180, puntos.length * 36 + 40) : 240;

  return (
    <section className="rounded-xl border border-nk-border bg-nk-surface p-4" aria-label={titulo}>
      <h2 className="font-manrope text-base font-bold text-nk-fg">{titulo}</h2>
      {puntos.length === 0 ? (
        <p className="mt-2 text-sm text-nk-fg-muted">Sin datos en este periodo.</p>
      ) : (
        <>
          <div className="mt-3 w-full" style={{ height: alto }} aria-hidden="true">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={puntos} layout={horizontal ? "vertical" : "horizontal"} margin={{ left: horizontal ? 16 : 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={!horizontal} horizontal={horizontal ? false : true} />
                {horizontal ? (
                  <>
                    <XAxis type="number" tickFormatter={formato} />
                    <YAxis type="category" dataKey="nombre" width={130} />
                  </>
                ) : (
                  <>
                    <XAxis dataKey="nombre" />
                    <YAxis tickFormatter={formato} width={90} />
                  </>
                )}
                <Tooltip formatter={(v) => formato(Number(v))} />
                <Bar dataKey="total" cursor="pointer" onClick={(p) => pulsar((p as unknown as { clave: string }).clave)}>
                  {puntos.map((p) => (
                    <Cell key={p.clave} fill={!elegida ? COLOR : p.clave === elegida ? COLOR_ELEGIDA : COLOR_APAGADA} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <table className="mt-3 w-full text-sm text-nk-fg">
            <tbody>
              {puntos.map((p) => (
                <tr key={p.clave} data-testid={testidFila} data-clave={p.clave} data-total={p.total} className="border-t border-nk-border">
                  <td className="py-2">
                    {href ? (
                      <Link href={href(p.clave)} className="font-semibold underline">
                        {p.nombre}
                      </Link>
                    ) : (
                      <button
                        type="button"
                        onClick={() => onElegir?.(p.clave)}
                        aria-pressed={elegida === p.clave}
                        className="min-h-11 font-semibold underline"
                      >
                        {p.nombre}
                      </button>
                    )}
                  </td>
                  <td className="py-2 text-right tabular-nums">{formato(p.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </section>
  );
}
