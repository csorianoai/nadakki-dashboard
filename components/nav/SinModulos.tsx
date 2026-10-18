import Link from "next/link";

export const MENSAJE_SIN_MODULOS = "Tu organización no tiene módulos habilitados para tu rol; pide acceso a un administrador";

/** Pantalla llana cuando el usuario no tiene ningún módulo: en lugar de un menú «Elegir módulo» vacío. */
export function SinModulos() {
  return (
    <section data-testid="sin-modulos" role="status" className="mx-auto max-w-xl p-8 text-[var(--dcc-fg,#0B1220)]">
      <p className="text-base">{MENSAJE_SIN_MODULOS}</p>
      <Link href="/" className="mt-4 inline-block text-sm text-[var(--dcc-teal-ink,#0F766E)] underline">
        Volver al inicio
      </Link>
    </section>
  );
}
