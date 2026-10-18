/** Etiquetas en español para valores crudos del backend que se pintaban en inglés (PS-12). */
const CONDICION: Record<string, string> = { new: "Nuevo", used: "Usado", nuevo: "Nuevo", usado: "Usado" };

export function etiquetaCondicionVehiculo(valor: unknown): string {
  const texto = String(valor ?? "");
  return CONDICION[texto.trim().toLowerCase()] ?? texto;
}

export function etiquetaRevisionManual(estado: string): string {
  return estado === "PENDING_MANUAL_REVIEW" ? "Pendiente de revisión manual" : estado;
}
