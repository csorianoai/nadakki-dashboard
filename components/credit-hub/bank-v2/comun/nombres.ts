const FORMA_UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const SIN_NOMBRE = "Sin nombre";

/**
 * Nombre visible de una persona o empresa (analista, dealer). Si no hay nombre devuelve
 * "Sin nombre": NUNCA el identificador. Un "nombre" con forma de UUID (el backend a veces
 * rellena el nombre con el id) también cuenta como ausente. El id va solo en atributos
 * data-* o title, para soporte; este parámetro existe para que el sitio de llamada lo
 * tenga a mano, la función no lo imprime.
 */
export function nombreOIdentificadorOculto(nombre: unknown, _id?: unknown): string {
  const n = typeof nombre === "string" ? nombre.trim() : "";
  return n && !FORMA_UUID.test(n) ? n : SIN_NOMBRE;
}

/** Como la anterior, pero null si no hay nombre (para campos que se omiten cuando faltan). */
export function nombreOpcional(nombre: unknown): string | null {
  const n = nombreOIdentificadorOculto(nombre);
  return n === SIN_NOMBRE ? null : n;
}
