import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { analyticsDemoActivo } from "./flag";
import { PantallaDemo } from "./PantallaDemo";
import type { EstadoPantalla } from "./tipos";

/**
 * Executive Command Center — pantalla patron de Nadakki Analytics (Fase C). SOLO vista previa.
 *
 * Esta ruta renderiza datos DEMO y por eso esta detras de un flag que se resuelve aqui, en el servidor y en codigo
 * (ver ./flag.ts): encendida en la vista previa de Vercel (VERCEL_ENV === "preview") o en local con
 * NEXT_PUBLIC_ANALYTICS_DEMO=1; APAGADA en produccion pase lo que pase (404, sin cargar ni un dato DEMO).
 * Los datos DEMO se cargan con import() dinamico DESPUES de comprobar el flag: nunca hay un import estatico de ./demo.
 * Cuando existan T6a, B2-T1 y B2-T2 se sustituye el adaptador DEMO por el real (contrato: docs/marketing/analytics-contratos/M1_resumen_ejecutivo.md).
 */
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Executive Command Center · vista previa",
  robots: { index: false, follow: false },
};

type Busqueda = Record<string, string | string[] | undefined>;

/** `?estado=cargando|error|vacio|desactualizado` solo se honra en modo demo, para revisar los estados. */
function leerEstado(sp: Busqueda | undefined): "ok" | EstadoPantalla | "desactualizado" {
  const v = sp?.estado;
  const e = Array.isArray(v) ? v[0] : v;
  return e === "cargando" || e === "error" || e === "vacio" || e === "desactualizado" ? e : "ok";
}

export default async function Page({ searchParams }: { searchParams?: Promise<Busqueda> | Busqueda }) {
  if (!analyticsDemoActivo()) notFound();

  const { DATOS_DEMO, AHORA_DEMO } = await import("./demo/datos-demo");
  const pedido = leerEstado(await searchParams);
  const estado: EstadoPantalla = pedido === "desactualizado" ? "ok" : pedido;
  // Reloj de la demo congelado (determinista); "desactualizado" lo adelanta 4 dias para mostrar el aviso.
  const ahora = pedido === "desactualizado" ? new Date(Date.parse(AHORA_DEMO) + 4 * 86_400_000).toISOString() : AHORA_DEMO;

  return <PantallaDemo datos={DATOS_DEMO} estado={estado} ahora={ahora} />;
}
