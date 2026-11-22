import type { Metadata } from "next";
import { fuenteDePantalla } from "./flag";
import { PantallaReal } from "./PantallaReal";
import type { EstadoPantalla, TemaPantalla } from "./tipos";

/**
 * Executive Command Center. Dos fuentes, decididas aqui en el servidor (ver ./flag.ts):
 *  - REAL (produccion y por defecto): consulta /api/v1/marketing/insights/summary. La ruta sigue OCULTA del menu (manifiesto).
 *  - DEMO (solo vista previa de Vercel o local con NEXT_PUBLIC_ANALYTICS_DEMO=1): datos de ejemplo con banner. En produccion la demo
 *    no existe: se carga con import() dinamico DESPUES de comprobar el flag, nunca hay un import estatico de ./demo.
 */
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Executive Command Center",
  robots: { index: false, follow: false },
};

type Busqueda = Record<string, string | string[] | undefined>;

/** `?estado=cargando|error|vacio|desactualizado` solo se honra en modo demo, para revisar los estados. */
function leerEstado(sp: Busqueda | undefined): "ok" | EstadoPantalla | "desactualizado" {
  const v = sp?.estado;
  const e = Array.isArray(v) ? v[0] : v;
  return e === "cargando" || e === "error" || e === "vacio" || e === "desactualizado" ? e : "ok";
}

/** `?tema=claro|oscuro`. Por defecto OSCURO (azul noche): es la version que se revisa para BASELINE_APPROVED. */
function leerTema(sp: Busqueda | undefined): TemaPantalla {
  const v = sp?.tema;
  const t = Array.isArray(v) ? v[0] : v;
  return t === "claro" || t === "light" ? "light" : "dark";
}

export default async function Page({ searchParams }: { searchParams?: Promise<Busqueda> | Busqueda }) {
  const busqueda = await searchParams;
  const f = busqueda?.fuente;
  const fuente = fuenteDePantalla(Array.isArray(f) ? f[0] : f);
  const tema = leerTema(busqueda);

  if (fuente === "real") return <PantallaReal ahora={new Date().toISOString()} tema={tema} />;

  const { PantallaDemo } = await import("./PantallaDemo");
  const { DATOS_DEMO, AHORA_DEMO } = await import("./demo/datos-demo");
  const pedido = leerEstado(busqueda);
  const estado: EstadoPantalla = pedido === "desactualizado" ? "ok" : pedido;
  // Reloj de la demo congelado (determinista); "desactualizado" lo adelanta 4 dias para mostrar el aviso.
  const ahora = pedido === "desactualizado" ? new Date(Date.parse(AHORA_DEMO) + 4 * 86_400_000).toISOString() : AHORA_DEMO;

  return <PantallaDemo datos={DATOS_DEMO} estado={estado} ahora={ahora} tema={tema} />;
}
