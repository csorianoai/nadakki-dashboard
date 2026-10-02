"use client";

/**
 * Un fallo de carga se dice, con su motivo y un boton para reintentar.
 *
 * Existe porque Libro mayor y Balance eran las dos unicas pantallas contables
 * que cargaban `listPeriodos` dentro de un `.then()` SIN `.catch()` (D8,
 * suite#1501): si `/periodos` fallaba, la promesa quedaba rechazada sin
 * manejar, el selector de periodo se quedaba vacio y la pantalla no decia
 * nada. Plan de cuentas no las sufria porque envuelve su unica llamada en
 * `try/catch`, y tampoco pide `/periodos`.
 *
 * Deliberadamente NO cierra la sesion ni ofrece "Cerrar sesion": que
 * `/periodos` falle no dice nada sobre si la sesion es valida. Eso lo decide
 * `lib/auth/auth-context.tsx`, y solo ante un 401.
 */

export function ErrorConReintentar({
  titulo,
  detalle,
  onReintentar,
}: {
  titulo: string;
  detalle?: string;
  onReintentar: () => void;
}) {
  return (
    <section
      role="alert"
      data-testid="contable-error-reintentar"
      className="mb-4 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-100"
    >
      <p className="font-semibold">{titulo}</p>
      {detalle ? <p className="mt-1 text-amber-200/90">{detalle}</p> : null}
      <button
        type="button"
        onClick={onReintentar}
        className="mt-3 rounded-md border border-amber-400/40 bg-amber-400/10 px-3 py-1.5 text-xs font-semibold text-amber-100 transition-colors hover:bg-amber-400/20"
      >
        Reintentar
      </button>
    </section>
  );
}
