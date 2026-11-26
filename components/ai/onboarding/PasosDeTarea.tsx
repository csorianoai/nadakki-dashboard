/**
 * Pasos de una tarea (cargar un auto, cargar una factura, vender, abrir un expediente...): lista con lo hecho, lo que
 * falta y el boton del siguiente paso. Solo presenta: cada pantalla calcula `hecho` con sus datos reales.
 *
 * Colores por variable de tema: --onb-accent, --onb-primary, --onb-on-primary y --onb-border; sin ellas, los del
 * concesionario (--dcc-*), asi Autos se ve igual que antes. Otro core define las --onb-* en su contenedor.
 *
 * Avisar progreso: tras guardar algo que cambia el avance, llamar `avisarProgreso()`; la bienvenida y cualquier lista
 * que escuche `EVENTO_PROGRESO` se recalcula sin esperar a la proxima sesion.
 */
import Link from "next/link";

export { avisarProgreso, EVENTO_PROGRESO } from "@/lib/agents/onboarding/progreso";

export type PasoTarea = {
  id: string;
  titulo: string;
  hecho: boolean;
  /** Ayuda corta: que hay que hacer en este paso. */
  ayuda?: string;
  /** Pantalla donde se hace el paso; sin enlace, el paso se hace en la misma pantalla. */
  enlace?: string;
  /** Paso que no aplica a este caso (p. ej. comision sin vendedor): no cuenta ni bloquea. */
  opcional?: boolean;
};

export function resumenPasos(pasos: PasoTarea[]): { hechos: number; total: number; siguiente: PasoTarea | null } {
  const cuentan = pasos.filter((p) => !p.opcional);
  return {
    hechos: cuentan.filter((p) => p.hecho).length,
    total: cuentan.length,
    siguiente: cuentan.find((p) => !p.hecho) ?? null,
  };
}

export function PasosDeTarea({ titulo, pasos, final }: { titulo: string; pasos: PasoTarea[]; final?: string }) {
  const { hechos, total, siguiente } = resumenPasos(pasos);
  return (
    <section
      role="region"
      aria-label={titulo}
      className="rounded-lg border border-[var(--onb-border,var(--dcc-border-strong))] bg-[var(--bg)] p-4 text-[var(--fg)]"
    >
      <h2 className="text-base font-semibold">
        {titulo}: {hechos} de {total}
      </h2>
      <ol className="mt-3 space-y-2 text-sm" aria-label={`Pasos de ${titulo}`}>
        {pasos.map((p, i) => (
          <li key={p.id} className="flex gap-2" data-testid={`paso-${p.id}`}>
            <span aria-hidden="true" className={p.hecho ? "text-[var(--onb-accent,var(--dcc-teal))]" : "opacity-60"}>
              {p.hecho ? "✓" : `${i + 1}.`}
            </span>
            <span>
              <span className="sr-only">{p.hecho ? "Hecho: " : p.opcional ? "Opcional: " : "Pendiente: "}</span>
              {!p.hecho && p.enlace ? (
                // Cada paso pendiente con pantalla propia se puede tocar, no solo el siguiente (Cowork 26-nov):
                // enlace de texto subrayado con 44px de alto tocable. Los hechos quedan sin enlace.
                <Link
                  href={p.enlace}
                  data-testid={`paso-enlace-${p.id}`}
                  className={`inline-flex min-h-11 items-center underline underline-offset-2 focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-[var(--onb-accent,var(--dcc-teal))]${
                    siguiente?.id === p.id ? " font-semibold" : ""
                  }`}
                >
                  {p.titulo}
                  {p.opcional ? " (opcional)" : ""}
                </Link>
              ) : (
                <span className={p.hecho ? "line-through opacity-70" : siguiente?.id === p.id ? "font-semibold" : ""}>
                  {p.titulo}
                  {p.opcional ? " (opcional)" : ""}
                </span>
              )}
              {p.ayuda && !p.hecho ? <span className="block opacity-80">{p.ayuda}</span> : null}
            </span>
          </li>
        ))}
      </ol>
      <div className="mt-3 text-sm">
        {siguiente ? (
          siguiente.enlace ? (
            <Link
              href={siguiente.enlace}
              aria-label={`Siguiente paso: ${siguiente.titulo}`}
              className="inline-flex min-h-11 items-center rounded bg-[var(--onb-primary,var(--dcc-navy))] px-3 font-semibold text-[var(--onb-on-primary,var(--dcc-on-navy))] focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-[var(--onb-accent,var(--dcc-teal))]"
            >
              Siguiente paso: {siguiente.titulo}
            </Link>
          ) : (
            <p data-testid="paso-siguiente-aqui">
              <span className="font-semibold">Siguiente paso:</span> {siguiente.titulo}, en esta pantalla.
            </p>
          )
        ) : (
          <p data-testid="pasos-completos" className="font-semibold text-[var(--onb-accent,var(--dcc-teal))]">
            {final ?? "Listo: completaste todos los pasos."}
          </p>
        )}
      </div>
    </section>
  );
}
